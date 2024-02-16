const fs = require('fs').promises;
const path = require('path');
const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, EmbedBuilder } = require('discord.js');

function parseTime(timeString) {
    const regex = /^(\d+)(s|m|h|d)$/; // s: seconds, m: minutes, h: hours, d: days
    const match = regex.exec(timeString);

    if (!match) return null;

    const num = parseInt(match[1]);
    const unit = match[2];

    let multiplier = 1000; // milliseconds
    if (unit === 'm') multiplier *= 60;
    else if (unit === 'h') multiplier *= 3600;
    else if (unit === 'd') multiplier *= 86400;

    return num * multiplier;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remind')
        .setDescription('Set a reminder')
        .addStringOption(option =>
            option.setName('time')
                .setDescription('Time until reminder (e.g., 1h, 30m)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reminder')
                .setDescription('Reminder message')
                .setRequired(true)),
    async execute(interaction) {
        const time = interaction.options.getString('time');
        const reminder = interaction.options.getString('reminder');
        const guildId = interaction.guildId;

        const timeMilliseconds = parseTime(time);
        if (!timeMilliseconds) {
            return interaction.reply({ content: 'Invalid time format. Please use a valid time format.', ephemeral: true });
        }

        const remindersFile = path.join(__dirname, '..', '..', 'data', `reminders.json`);

        // Load existing reminders
        let reminders = [];
        try {
            const data = await fs.readFile(remindersFile);
            reminders = JSON.parse(data);
        } catch (error) {
            if (error.code !== 'ENOENT') {
                console.error('Error reading reminders file:', error);
            }
        }

        // Add new reminder
        reminders.push({ reminder, time: Date.now() + timeMilliseconds });
        await fs.writeFile(remindersFile, JSON.stringify(reminders, null, 2));

        setTimeout(() => {
            const storedReminderIndex = reminders.findIndex(item => item.reminder === reminder);
            if (storedReminderIndex !== -1) {
                const storedReminder = reminders.splice(storedReminderIndex, 1)[0];

                const reminderEmbed = new EmbedBuilder()
                    .setColor('#0099ff')
                    .setTitle('Reminder')
                    .setDescription(storedReminder.reminder)
                    .setTimestamp();

                interaction.followUp({ embeds: [reminderEmbed] });

                // Save updated reminders
                fs.writeFile(remindersFile, JSON.stringify(reminders, null, 2))
                    .catch(error => console.error('Error saving reminders file:', error));
            }
        }, timeMilliseconds);

        await interaction.reply({ content: `Reminder set for ${time} from now. **WARNING: This feature is still experimental and reminders may not save if the bot restarts!**`, ephemeral: true });
    }
};