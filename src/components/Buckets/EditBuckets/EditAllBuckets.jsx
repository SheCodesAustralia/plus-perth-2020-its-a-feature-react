import React, { useState, useEffect, useRef } from "react";
import { useHistory } from "react-router-dom";
import IconWrap from "../../IconWrap/IconWrap"
import IconOption from "../../IconOption/IconOption"


import "../EditBuckets/EditBuckets.css";
import "../../Buckets/Buckets.css";

import Bucket_img from "../../../assets/images/bucket.png";
import Delete from "../../../assets/images/delete.png";
import Bucket from './Bucket'

// Recursive function to extract individual buckets from nested bucket list
const getBucketList = buckets => {

  let bucketList = {}

  const getChildrenIds = (children) => {
    children.forEach(b => {
      bucketList[b.id] = b
      if (b.children) getChildrenIds(b.children)
    })
  }
  getChildrenIds(buckets)

  return bucketList
}


function Buckets() {

  // This is used to display the buckets on the page in correct order
  const [buckets, setBuckets] = useState();

  // This is used to change the bucket details which will then be POSTED to API
  const [updatedBuckets, setUpdatedBuckets] = useState();

  // This is used to update the error array instantly - required for the save function to work properly
  const percentageError = useRef([]);

  // This is used to force a re-render so the errors will be displayed on the page
  const [errorMsg, setErrorMsg] = useState([]);

  // This is used to show error if POST request fails
  const [fetchErrorMsg, setFetchErrorMsg] = useState();

  const token = window.localStorage.getItem("token");
  const history = useHistory();

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}buckets`, {
        headers: {
            "Content-Type": "application/json",
            Authorization: `token ${token}`,
        },
    })
        .then((results) => {
            return results.json();
        })
        .then((data) => {
            setBuckets(data);
        });
}, [token]);

  // Flatten list of buckets into separate account objects - property/key is the bucket ID (this is used to keep track of which bucket user is updating)
  useEffect(() => {
    if (buckets) {
      setUpdatedBuckets(getBucketList(buckets))
    }
  }, [buckets]);

  const handleChange = (e, bucketID) => {
    let { id, value } = e.target;
    if (id === "percentage") {
      value = parseInt(value);
    } else if (id === "min_amt") {
      value = parseFloat(value).toFixed(2)
    }
    const update = updatedBuckets[bucketID];
    update[id] = value;
    setUpdatedBuckets((prevBuckets) => ({
      ...prevBuckets,
      update
    }));
  }

  const checkBucketPercentages = (parentBucket) => {
    let bucketIDs = [];
    if (!parentBucket) {
      bucketIDs = buckets.map(bucket => bucket.id)
    } else {
      bucketIDs = parentBucket.children.map(bucket => bucket.id)
    }
    const totals = bucketIDs.map(id => updatedBuckets[id].percentage);

    const total = totals.reduce((accumulator, value) => accumulator + value);

    const index = percentageError.current.indexOf(parentBucket ? parentBucket.name : "top-level");

    if (total !== 100) {
      if (index > -1) {
        return
      }
      percentageError.current = ([
        ...percentageError.current,
        parentBucket ? parentBucket.name : "top-level"
      ])
    }
    else {
      const errors = percentageError.current;
      if (index > -1) {
        errors.splice(index, 1);
      }
    }
  }

  const postBucketUpdate = async (bucket) => {
    const response = await fetch(`${process.env.REACT_APP_API_URL}buckets/${bucket.id}/`, {
      method: "put",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `token ${token}`
      },
      body: JSON.stringify(bucket),
    });
    return response.json();
  }


//   const getBucketList = buckets => {

//     let bucketList = {}
  
//     const getChildrenIds = (children) => {
//       children.forEach(b => {
//         bucketList[b.id] = b
//         if (b.children) getChildrenIds(b.children)
//       })
//     }
//     getChildrenIds(buckets)
  
//     return bucketList
//   }

  const saveChanges = () => {
    setFetchErrorMsg();
    // checkBucketPercentages(null);
    // const checkAllBucketPercentages = (children) => {
    //     children.forEach(b => {
    //       buckets[b.id] = b
    //       if (b.children) checkBucketPercentages(b.children)  
    //     })
    // }
    // checkBucketPercentages(getBucketList(buckets))

    for (let i = 0; i < buckets.length; i++) {
      if (buckets[i].children.length > 0) {
        checkBucketPercentages(buckets[i])
        for (let j = 0; j < buckets[i].children.length; j++) {
          if (buckets[i].children[j].children.length > 0) {
            checkBucketPercentages(buckets[i].children[j])
          }
        }
      }
    }
    
    if (percentageError.current.length === 0) {
      setErrorMsg([]);

      // Iterating over object...
      for (var key in updatedBuckets) {
        if (parseInt(key)) {
          postBucketUpdate(updatedBuckets[key])
            .then((response) => {
              if (response.owner) {
                history.push("/");
              }
              else {
                setFetchErrorMsg("Unable to save changes. Please try again later.")
              }
            })
        }
      }
    }
    else {
      setErrorMsg(percentageError.current);
    }
  }

  return buckets ? (
    <React.Fragment>
      <div>
        <button onClick={saveChanges}>SAVE CHANGES :)</button>
        {fetchErrorMsg ? (
          <div>
            <h2>{fetchErrorMsg}</h2>
          </div>
        ) : null}
        {errorMsg.length > 0 ? (
          <div>
            <h2>Something doesn't add up</h2>
            <h4>check the child accounts of... </h4>
            <ul>
              {errorMsg.map((error) => {
                return error === "top-level" ? (
                  <li>Your top level</li>
                ) : (
                    <li>{error}</li>
                  );
              })}
            </ul>
          </div>
        ) : null}
      </div>

      <div >
        {buckets.map(bucket =>
          <div className="bucket-group animated fadeInLeft">
            <Bucket bucket={bucket} handleChange={handleChange} />
          </div>
        )}
       </div>  
    </React.Fragment>
  ) : (
      <h2>Couldn't find any buckets!</h2>
  );
}

export default Buckets;
