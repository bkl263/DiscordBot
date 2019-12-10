const Discord = require("discord.js")
const fs = require('fs')
var config = require("./config.json")
const tespa = require("./index.js") //consider renaming index.js to something else
const client =  new Discord.Client()
// const { Transform } = require('stream')

// const googleSpeech = require('@google-cloud/speech')
// const googleSpeechClient = new googleSpeech.SpeechClient()

var connections = {}

function embedMatch(match) {
  return {embed: {
    color: 5703308,
    title: match.name,
    url: "https://google.com",
    description: match.university,
    fields: [{
      name: "Time",
      value: `${convertTime(match.time)}`,
      inline: true
    },
    { name: "Maps",
      value: `${match.maps[0]} ${match.maps[1]} ${match.maps[2]}`,
      inline: true
    },
    {
      name: "Contact",
      value: `BattleTag: ${match.bnet}
              Discord: ${match.discord}`
    }],
    footer: {
      text: "© btDiscordBot"
    }
  }}
}

function convertTime(dateObj) { //may consider not using javascript Date since a lot of it is repetative but hey its there
  monthsArr = ["January", "February", "March", "April", "May", "June", "July", "Augest", "September", "October", "November", "December"]
  suffix = ["th","st","nd","rd"]
  var dateString;

  let month = monthsArr[dateObj.getMonth()]
  let date = dateObj.getDate()
  let hours = dateObj.getHours()
  let minutes = dateObj.getMinutes()
  let meridiem = "AM"

  if ((date % 10) > 3) { date = date.toString() + 'th' }
  else { date = date.toString() + suffix[date] }
  if(hours > 12) { hours -= 12; meridiem = "PM" }
  if (minutes < 10) { minutes = "0" + minutes.toString() }

  dateString = `${month} ${date} ${hours}:${minutes}${meridiem} EST` //hours is wrong (in PST) change this in index.js not here
  return dateString
}

// function convertBufferTo1Channel(buffer) {
//   const convertedBuffer = Buffer.alloc(buffer.length / 2)
//
//   for (let i = 0; i < convertedBuffer.length / 2; i++) {
//     const uint16 = buffer.readUInt16LE(i * 4)
//     convertedBuffer.writeUInt16LE(uint16, i * 2)
//   }
//
//   return convertedBuffer
// }
//
// class ConvertTo1ChannelStream extends Transform {
//   constructor(source, options) {
//     super(options)
//   }
//
//   _transform(data, encoding, next) {
//     next(null, convertBufferTo1Channel(data))
//   }
// }


function isACommand(message) {
  return message.content[0] == config.serverSettings[message.guild.id].prefix
}

function join(message) {
  if(message.member.voiceChannel) {
    message.member.voiceChannel.join().then(connection => {
      message.channel.send(`Joined ${message.member.voiceChannel.name}`)
      console.log(`Successfully joined ${message.guild.nameAcronym}.${message.member.voiceChannel.name}`)
      var disp = connection.playFile('C:/Users/user/Desktop/test.mp3')
      connections[message.guild.id] = { connection: connection, dispatcher: disp }
    })
    .catch(console.error)
  }
  else {
    console.log(`Voice connection attempt failed: User not in a voice channel`)
    message.reply("You must join a voice channel first!")
    return null
  }
}

function play(message) {
  if(connection) {
    dispatcher = connection.playFile('C:/Users/WhoDis/Desktop/test.mp3');
  }
  else {
    message.reply(`I must ${config.serverSettings[message.guild.id].prefix}join a voice channel first!`)
  }
}

client.on('ready', () => {
  console.log("Bot online")
})

client.on('warn', warn => {
  console.log(warn)
})

client.on('error', e => {
  console.error(e)
})

client.on('guildCreate', guild => {
  console.log(`Joined a new guild: ${guild.name}`)
  fs.readFile('./config.json','utf8', (err, data) => {
    if (err) {console.log("File read error")}
    else {
      var configFile = JSON.parse(data)
      var serverSettings = {}
      serverSettings.prefix = configFile.defaultPrefix
      configFile.serverSettings[guild.id] = serverSettings
      fs.writeFileSync('./config.json', JSON.stringify(configFile, null, 2), err => {
        if (err) {console.log("File write error")}
        else{ console.log("Successfully updated prefix");}
      })
    }
  })
})

client.on('message', message => {
  if (isACommand(message)) {
    let messageArray = message.content.toLowerCase().substring(1).split(" ")
    switch(messageArray[0]) {

      case 'join':
        join(message)
        break;

      case 'disconnect':
        console.log(`Attempting disconnection`)
        if (client.voiceConnections.get(message.guild.id)) {
          let connection = client.voiceConnections.get(message.guild.id)
          connection.disconnect()
          console.log(`Successfully disconnected from ${connection.channel.guild.nameAcronym}.${connection.channel.name}`)
          message.channel.send(`Disconnected from ${connection.channel.name}`)
        }
        else {console.log("No valid connection to disconnect from")}
        break;

      case 'play':
        play(message)
        break;

      case 'setprefix':
        let validCharacters = ['!', '$', '`','~','%','&','*']
        //if command is given with arguement and the arguement given is a character and inside the validCharacters array
        if (messageArray.length == 2 && messageArray[1].length == 1 && validCharacters.includes(messageArray[1])) {
          config.serverSettings[message.guild.id].prefix = messageArray[1]
          fs.readFile('./config.json','utf8', (err, data) => {
            if (err) {console.log("File read error")}
            else {
              var configFile = JSON.parse(data)
              configFile.serverSettings[message.guild.id].prefix = messageArray[1]
              console.log(`Updated configuration file`)
              fs.writeFileSync('./config.json', JSON.stringify(configFile, null, 2), err => {
                if (err) {console.log("File write error")}
                else{ console.log("Successfully updated prefix");}
                //need to write discord response on success
              })
            }
          })
        }
        else {
          message.reply(`Please ensure you are using a valid argument for ${config.serverSettings[message.guild.id].prefix}setprefix`)
        }
        break;

      case 'getmatches':
        tespa.getMatches().then(matches => {
          message.channel.send(embedMatch(matches[0]))
          message.channel.send(embedMatch(matches[1]))
        })
        break;

      case 'clean':
        try {
          var deleteAmount = parseInt(messageArray[1]) + 1
          message.channel.bulkDelete(deleteAmount)
        }
        catch(err) {
          if(messageArray[1]) { message.reply(`Invalid arguement ${messageArray[1]}`) }
          else {message.channel.bulkDelete(100)}
        }
        break;

      default:
        console.log("Unresolved Case")
    }
  }
})

client.login(config.token)
