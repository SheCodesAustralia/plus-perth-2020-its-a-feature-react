import React, { useState, useEffect } from "react";
import { oneBucket } from "../../data";
import Bucket from "../../components/Buckets/Buckets";
import { getStorage } from "../../helpers/localStorage";
import LoginForm from "../../components/LoginForm/LoginForm";
import IncomeForm from "../../components/Buckets/IncomeForm";

function HomePage() {
  const [bucketList, setBucketList] = useState([]);
  const token = window.localStorage.getItem("token");
  const [income, setIncome] = useState();

  console.log(token);

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
        setBucketList(data);
      });
  }, []);

  const upDateIncome = (income) => {
    setIncome(income);
  };

  // console.log("bucketList is...", bucketList);

  return (
    //<p> Hi</p>

    <div>
      {token != null ? (
        <div id="bucket-list">
          <IncomeForm receipt={bucketList} upDateIncome={upDateIncome} />

          <div id="bucket-list">
            {bucketList.map((bucketData, key) => {
              return (
                <Bucket key={key} bucketData={bucketData} income={income} />
              );
            })}{" "}
          </div>
        </div>
      ) : (
        <LoginForm />
      )}

    </div>
  );
}

export default HomePage;
