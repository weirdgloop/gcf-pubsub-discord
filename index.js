const discord = require('discord.js')

const webhookClient = new discord.WebhookClient({
    url: process.env.DISCORD_WEBHOOK_URL
})

module.exports.app = (event, context) => {
    const data = Buffer.from(event.data, 'base64').toString()
    const attributes = event.attributes
    const payload = JSON.parse(attributes.payload)

    // Only UpgradeEvent is supported for now.
    if (attributes.type_url !== 'type.googleapis.com/google.container.v1beta1.UpgradeEvent') return

    let embed = new discord.MessageEmbed()
        .setTitle('Upgrading Cluster')
        .setColor('#3498DB')
        .addFields([
            { name: 'Resource Type', value: payload.resourceType, inline: true },
            { name: 'Current Version', value: payload.currentVersion, inline: true },
            { name: 'Target Version', value: payload.targetVersion, inline: true },
        ])
        .setDescription(data)
        .setFooter({ text: attributes.cluster_location + '/' + attributes.cluster_name })
        .setTimestamp(new Date(payload.operationStartTime))

    webhookClient.send({
        username: 'Google Cloud',
        embeds: [embed]
    })
}
