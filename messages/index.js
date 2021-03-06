// This loads the environment variables from the .env file
require('dotenv-extended').load();

var builder = require('botbuilder');
var restify = require('restify');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
    console.log('%s listening to %s', server.name, server.url);
});

// Create chat bot and listen to messages
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
server.post('/api/messages', connector.listen());

var DialogLabels = {
    Nails: 'Nails',
    Hair: 'Hair',
    Colour: 'Colour',
    Style: 'Style',
    Help: 'Help'
};

var bot = new builder.UniversalBot(connector, [
    function (session) {
        // prompt for search option
        builder.Prompts.choice(
            session,
            'Are you looking for a flight or a hotel?',
            [DialogLabels.Nails, DialogLabels.Hair],
            {
                maxRetries: 3,
                retryPrompt: 'Not a valid option'
            });
    },
    function (session, result) {
        if (!result.response) {
            // exhausted attemps and no selection, start over
            session.send('Ooops! Too many attemps :( But don\'t worry, I\'m handling that exception and you can try again!');
            return session.endDialog();
        }

        // on error, start over
        session.on('error', function (err) {
            session.send('Failed with message: %s', err.message);
            session.endDialog();
        });

        // continue on proper dialog
        var selection = result.response.entity;
        switch (selection) {
            case DialogLabels.Nails:
                return session.beginDialog('flights');
            case DialogLabels.Hair:
                return session.beginDialog('hotels');
        }
    }
]);

bot.dialog('nail', require('./nail'))
    .triggerAction({
        matches: [/nail/i, /manicure/i, /pedicure/i, /pedi/i, /mani/i]
    });
bot.dialog('hair', require('./hair'))
    .triggerAction({
        matches: [/hair/i, /cut/i, /haircut/i]
    });
bot.dialog('colour', require('./colour'))
    .triggerAction({
        matches: [/help/i, /support/i, /problem/i]
    });
bot.dialog('style', require('./style'))
    .triggerAction({
        matches: [/style/i, /blowdry/i, /formals/i]
    });
bot.dialog('help', require('./help'))
    .triggerAction({
        matches: [/help/i, /support/i, /problem/i]
    });

// log any bot errors into the console
bot.on('error', function (e) {
    console.log('And error ocurred', e);
});