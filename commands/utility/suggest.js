const { SlashCommandBuilder } = require('@discordjs/builders');
const { CommandInteraction, EmbedBuilder} = require('discord.js');
const { suggestId, EmbedColour } = require('../../config.json')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('suggest')
        .setDescription('Suggest a new feature or improvement for the server')
        .addStringOption(option =>
            option.setName('suggestion')
                .setDescription('What is your suggestion?')
                .setRequired(true)),
    async execute(interaction = new CommandInteraction) {
        const suggestion = interaction.options.getString('suggestion');

        const embed = new EmbedBuilder()
            .setColor(EmbedColour)
            .setTitle('Suggestion:')
            .setDescription(suggestion)
            .setFooter({
                text: `Suggestion by: ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL(),
              })
            .setTimestamp();    

        const channel = interaction.guild.channels.cache.get(suggestId);

        if (!channel) {
            return interaction.reply('Sorry, the suggestions channel is not available at this time.');
        }

        const permissions = channel.permissionsFor(interaction.guild.me);

        const message = await channel.send({ embeds: [embed] });
        await message.startThread({ name: 'Suggestion Discussion', autoArchiveDuration: 1440 });
        message.react('✅');
        message.react('❌');

        await interaction.reply('Thank you for your suggestion! Our team will review it and follow up as necessary.');
    },
};