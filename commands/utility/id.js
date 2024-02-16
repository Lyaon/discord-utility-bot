const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('id')
		.setDescription('Replies with the id of the executor'),
	async execute(interaction) {
		await interaction.reply(`${interaction.user.id}`);
	},
};