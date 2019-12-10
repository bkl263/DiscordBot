const fs = require('fs');
const cheerio = require('cheerio');
const readline = require('readline');
const {google} = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
function getMatches() {

  return new Promise (resolve => {
    fs.readFile('credentials.json', async (err, content) => {
      if (err) return console.log('Error loading client secret file:', err);
      // Authorize a client with credentials, then call the Gmail API.
      var matches = await authorize(JSON.parse(content), parseEmail);
      resolve(matches)
    });
  })
}

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  return new Promise(resolve => {
    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) resolve(getNewToken(oAuth2Client, callback));
      oAuth2Client.setCredentials(JSON.parse(token));
      resolve(callback(oAuth2Client))
    });
  })
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise (resolve => {
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) resolve(console.error('Error retrieving access token', err));
        oAuth2Client.setCredentials(token);
        // Store the token to disk for later program executions
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) resolve(console.error(err));
          console.log('Token stored to', TOKEN_PATH);
        });
        resolve(callback(oAuth2Client))
      });
    });
  })
}

/**
 * Lists the labels in the user's account.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
async function parseEmail(auth) {
  const gmail = google.gmail({version: 'v1', auth})


  return new Promise(resolve => {
    gmail.users.messages.list({userId: 'me'}, (err, res) => {
      if (err) return console.log('The API returned an error: ' + err);

      const messages = res.data.messages;
      if (messages.length) {
        messages.forEach((message) => {
          gmail.users.messages.get({userId:'me',id:message.id}, async (err,res) => {
            if (err)  {console.log('The API returned an error: ' + err); return}
            const body = res.data

            await body.payload.headers.forEach((header) => {
              var ret = header.value
              const parts = res.data.payload.parts
              if(ret.includes('Tespa')) { //add case where there are multiple Tespa emails. We want the most current one. Probably have to change the forEach loop 3 lines above.
                var matchInfo = []
                //
                const messageBody = Buffer.from(parts[1].body.data, "base64").toString();
                const $ = cheerio.load(messageBody);
                const spans = $("span")
                const links = $("links")
                for (i = 0; i < spans.length; i++) {
                  var text = spans[i].children[0].data

                  if(text == "Match 1") {
                    var match1 =  {
                      time: getTime(spans[i+2].children[0].data),
                      maps: [spans[i+3].children[0].data.split(":")[1].trim(), spans[i+4].children[0].data.split(":")[1].trim(), spans[i+5].children[0].data.split(":")[1].trim()],
                      university: spans[i+6].children[0].data.split(":")[1].trim(),
                      name: spans[i+7].children[0].data.split(":")[1].trim(),
                      bnet: spans[i+9].children[0].data.split(":")[1].trim(),
                      discord: spans[i+10].children[0].data.split(":")[1].trim()

                    }
                    i+=11
                    var match2 =  {
                      time: getTime(spans[i+2].children[0].data),
                      maps: [spans[i+3].children[0].data.split(":")[1].trim(), spans[i+4].children[0].data.split(":")[1].trim(), spans[i+5].children[0].data.split(":")[1].trim()],
                      university: spans[i+6].children[0].data.split(":")[1].trim(),
                      name: spans[i+7].children[0].data.split(":")[1].trim(),
                      bnet: spans[i+8].children[0].data.split(":")[1].trim(),
                      discord: spans[i+9].children[0].data.split(":")[1].trim()

                    }
                    matchInfo.push(match1)
                    matchInfo.push(match2)
                    resolve(matchInfo) //add links into matchInfo.
                  }
                }
              }
            })
          })
        });
      } else {
        console.log('No messages found.');
        resolve(null)
      }
    });
  }).then(matches =>  {
    return matches
  })
}

function getTime(string) {
  stringArr = string.split(" ")
  var year = new Date().getFullYear()
  var month = stringArr[2]
  var date = parseInt(stringArr[3])
  var time = stringArr[5].split(":")
  var hours = parseInt(time[0])
  if (stringArr[6] == 'PM') { hours += 12; hours = hours.toString() }
  var minutes = time[1]
  var dateString = `${month} ${date} ${year} ${hours}:${minutes}`
  var dateObj = new Date(`${month} ${date} ${year} ${hours}:${minutes}`)
  return dateObj
}

exports.getMatches = getMatches
