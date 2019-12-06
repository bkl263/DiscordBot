const Discord = require("discord.js")
const perms = require("./perms.json")
const client =  new Discord.Client()
var COMMANDCHAR = '!'

function isACommand(text) {
  if (text[0] == COMMANDCHAR) {
    return true
  }
  return false
}

client.on('ready', () => {
  console.log("Bot online")
})

client.on('message', message => {
  if(message.channel.id == 652601171734822933) {
    if (isACommand(message.content)) {
      switch(message.content)
    }
  }
})

client.login(perms.token)
