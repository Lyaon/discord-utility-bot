const fs = require('node:fs');
const db = require('quick.db');
const path = require('node:path');
const express = require('express');
const bodyParser = require('body-parser');
const { Client, Collection, Events, GatewayIntentBits, ActivityType, EmbedBuilder, MessageAttachment } = require('discord.js');
const { token, guildId, logChannelId, autoroleId } = require('./config.json');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

// Initialize Express
const app = express();
const port = 3000;

// Parsing
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  }
}

    client.on('guildMemberAdd', (guildMember) => {
  guildMember.roles.add(autoroleId);
        console.log("Assigned a role!")
});

client.on('messageUpdate', (oldMessage, newMessage) => {
    if (!oldMessage.guild || oldMessage.author.bot) return;

    const logChannel = oldMessage.guild.channels.cache.get(logChannelId);

    if (logChannel) {
        // Log the edited message details as an embed
        const embed = new EmbedBuilder()
            .setColor('#ffff00')
            .setTitle('Edited Message Log')
            .addFields(
                { name: 'Author', value: oldMessage.author.tag },
                { name: 'Channel', value: oldMessage.channel.name },
                { name: 'Old Content', value: oldMessage.content },
                { name: 'New Content', value: newMessage.content }
            )
            .setTimestamp();

        logChannel.send({ embeds: [embed] }).catch(console.error);
    } else {
        console.error('Log channel not found. Please check the provided channel ID.');
    }
});

client.on('messageDelete', (deletedMessage) => {
    if (!deletedMessage.guild || deletedMessage.author.bot) return;

    const logChannel = deletedMessage.guild.channels.cache.get(logChannelId);

    if (logChannel) {
        let attachmentsField = 'N/A';

        if (deletedMessage.attachments.size > 0) {
            attachmentsField = '';
            deletedMessage.attachments.forEach(attachment => {
                if (attachment.url.match(/\.(png|jpg|jpeg|gif)$/)) { // Check if it's an image
                    // Add the image as an attachment to the embed
                    const attachmentFile = new MessageAttachment(attachment.url);
                    embed.setImage(attachment.url);
                } else {
                    attachmentsField += attachment.url + '\n'; // Add other attachments as links
                }
            });
        }

        // Log the deleted message details as an embed
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('Deleted Message Log')
            .addFields(
                { name: 'Author', value: deletedMessage.author.tag },
                { name: 'Channel', value: deletedMessage.channel.name },
                { name: 'Content', value: deletedMessage.content || '*Message content not available*' },
                { name: 'Attachments', value: attachmentsField } // Include attachments field here
            )
            .setTimestamp();

        logChannel.send({ embeds: [embed] }).catch(console.error);
    } else {
        console.error('Log channel not found. Please check the provided channel ID.');
    }
});

// Function to set bot's status
function setBotStatus(status) {
  client.user.setActivity(status, { type: ActivityType.Watching });
  }

// Routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.post('/status', (req, res) => {
  const newStatus = req.body.status;
  setBotStatus(newStatus);
  res.send('Bot status updated to: ' + newStatus);
});

client.once(Events.ClientReady, () => {
  console.log('Ready!');
  client.user.setActivity('2024!', { type: ActivityType.Watching });
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
    } else {
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
  }
});

client.login(token)
    .then(() => {
        console.log('Bot logged in successfully.');
        // Start the Express server after bot login
        app.listen(port, () => {
            console.log(`Server is listening at http://localhost:${port}`);
        });
    })
    .catch((error) => {
        console.error('Error logging in:', error);
    });