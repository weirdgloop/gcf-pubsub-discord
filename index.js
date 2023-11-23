const discord = require('discord.js')

const webhookClient = new discord.WebhookClient({
    url: process.env.DISCORD_WEBHOOK_URL
})

const handleGCPEvent = (data, attributes) => {
    switch (attributes.type_url) {
        case 'type.googleapis.com/google.container.v1beta1.UpgradeEvent':
            return `:arrow_up: **Upgrading (${attributes.cluster_location}/${attributes.cluster_name}): ${data}`
    }
}

const handleGCPLog = (data) => {
    if (data.hasOwnProperty('jsonPayload')) {
        const payload = data.jsonPayload;
        const clusterInfo = `**${data.resource.labels.cluster_name}**:`;

        if (payload.kind !== 'Event') return;

        switch (payload.reason) {
            case 'Created':
            case 'Killing':
                return `:wrench: ${clusterInfo} ${payload.message} [${data.resource.labels.pod_name}]`;
        }
    }
}

module.exports.app = (event, context) => {
    const data = Buffer.from(event.data, 'base64').toString()
    const attributes = event.attributes
    let msg = '';

    // Handle this differently depending on if it's an event that is coming from Google, or something from our log sink
    if (attributes.hasOwnProperty('payload')) {
        // This is a GCP event.
        msg = handleGCPEvent(data, attributes);
    } else {
        // This is a log from a log sink
        msg = handleGCPLog(JSON.parse(data));
    }

    if (!msg) return;

    webhookClient.send({
        username: 'Google Cloud',
        content: msg
    })
}
