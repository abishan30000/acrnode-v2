let axios = require("axios");

axios.interceptors.response.use(
  response => response,
  error => {
    // Handle error globally
    if (error.response) {
      console.warn("Axios error:", error.response.data);
    } else {
      console.warn("Axios error:", error.message);
    }
  }
);


let resclock = []; // Initialize the resclock array

async function repeat(n, username, password) {
  let timell=new Date().toLocaleString("en-US", {
      timeZone: "America/Los_Angeles"
    })
  console.log('Process Started, Time '+timell)
  try {
    let response = await auth(username, password);
    // console.log("RES: " + JSON.stringify(response))
    // console.log("RES2: "+ response.token)
    
    response = await timedBonus(response.token);
    if(response){
      let timestamp = new Date(); // Get current timestamp
      resclock.push(n); // Push n to the resclock array
      console.warn('Process successfully completed; Timestamp '+timell)
      return { timestamp, resclock }; // Return timestamp and resclock
    }
  } catch(err) {
    console.warn('repeat error', err);
    throw err; // Re-throw the error to handle it in the caller function
  }
}

async function timedBonus(token) {
  let headers = {
    authorization: "Bearer " + token,
  };
  let ops = '\x22\x7B\x7D\x22';
  let res = await axios.post(
    "https://dev-nakama.winterpixel.io/v2/rpc/collect_timed_bonus",
    ops,
    { headers: headers },
  );
  return "Done"
}

async function auth(username, password) {
  let payload = {
    email: username,
    password: password,
    vars: {
      client_version: "99999",
    },
  };
  let res = await axios.post(
    "https://dev-nakama.winterpixel.io/v2/account/authenticate/email?create=false",
    payload,
    {
      headers: {
        Authorization: `Basic OTAyaXViZGFmOWgyZTlocXBldzBmYjlhZWIzOTo=`,
        "Content-Type": "application/json",
      },
    },
  );
  return res.data;
}

// Export the repeat function to be used as a Netlify function
 let exported = async (event, context) => {
   const username = process.env.username || Netlify.env.get("username") 
   const password = process.env.password || Netlify.env.get("password") 
  try {
    

let claimCounter = 0;
const CLAIM_INTERVAL_MS = 1; 
const CLAIM_MAX = parseInt(process.env.CLAIM_MAX || "1000000", 10);

const claimInterval = setInterval(() => {
  claimCounter++;
  // call repeat without awaiting so the interval can keep firing
  try {
    repeat(claimCounter, username, password).catch
      ? repeat(claimCounter, username, password).catch(err => console.warn("repeat error in interval", err))
      : Promise.resolve().then(() => repeat(claimCounter, username, password));
  } catch (err) {
    console.warn("repeat call failed:", err);
  }
  if (claimCounter >= CLAIM_MAX) {
    clearInterval(claimInterval);
    console.warn("claim loop stopped after CLAIM_MAX iterations:", CLAIM_MAX);
  }
}, CLAIM_INTERVAL_MS);
// --- END INSERTED ---

const result = { resclock };
    const time = result.timestamp.toLocaleString("en-US", {
      timeZone: "America/Los_Angeles"
    });
    const responseMessage = `Bot status: Active<br>Last request: ${time}<br>[${result.resclock.join(', ')}]`;
    return Response.json({
      statusCode: 200,
      body: responseMessage,
    });
  } catch (error) {
    return Response.json({ statusCode: 500, body: JSON.stringify({ error: error.message }) });
  }
};

export default exported
export const config = {
  schedule: "0,5,10,15,20,25,30,35,40,45,50,55 * * * *"
}

