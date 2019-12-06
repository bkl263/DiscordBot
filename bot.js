const Discord = require("discord.js")
const config = require("./config.json")
const client =  new Discord.Client()
var voiceChannel;
var dispatcher;
function isACommand(text) {
  if (text[0] == config.prefix) {
    return true
  }
  return false
}

function join(message) {
  console.log("join() was called")
  if (message.member.voiceChannel) {
    message.member.voiceChannel.join()
    message.channel.send("Joined " + message.member.voiceChannel.name)
    voiceChannel = client.voiceConnections.get(message.guild.id)
  }
  else {
    message.reply("You must join a voice channel first!")
  }
}

function disconnect(message) {
  console.log("disconnect() was called")
  if (voiceChannel) {
    voiceChannel.disconnect()
    message.channel.send("Disconnected from " + voiceChannel.channel.name)
    voiceChannel = null
  }
}

function play(message) {
  if(voiceChannel) {
    dispatcher = voiceChannel.playFile('C:/Users/user/Desktop/test.mp3');
  }
  else {
    message.reply("Must !join a voice channel first!")
  }
}

client.on('ready', () => {
  console.log("Bot online")
})

client.on('message', message => {
  if(message.channel.id == 652601171734822933) {
    if (isACommand(message.content)) {
      switch(message.content.toLowerCase().substring(1)) {
        case 'join':
          join(message)
          break;
        case 'disconnect':
          disconnect(message)
          break;
        case 'play':
          play(message)
          break;
        default:
          console.log("Unresolved Case")

      }
    }
  }
})

client.login(config.token)
