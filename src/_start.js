// npm install sync-request readline-sync discord.js @discordjs/rest discord-api-types fs

const fs = require('fs');
const request = require('sync-request');
const rLSync = require('readline-sync');

var r, fn, d;


function startUp(bot, logout) { 
    if (!fs.existsSync('./config.json')) fs.writeFileSync('./config.json', "{}");
    const config = require('./config.json');
    if (!fs.existsSync('./version_data.json')) fs.writeFileSync('./version_data.json', JSON.stringify({"start_script": "1.0.0", "check-va.ts": "0.0.0", "config.json": "0.0.0", "JSON_Funcs.ts": "0.0.0", "leaderboard.ts": "0.0.0", "Logging.ts": "0.0.0", "main.js": "0.0.0", "VA_Basic.ts": "0.0.0", "other": ["node_modules", "last_active.json", "leaderboards.json", "package.json", "package-lock.json"]}));
    const local_versions = require('./version_data.json');
    if (!fs.existsSync('./last_active.json')) fs.writeFileSync('./last_active.json', "{}");
    if (!fs.existsSync('./leaderboards.json')) fs.writeFileSync('./leaderboards.json', "{}");


    var version_data = JSON.parse(request('GET', 'https://raw.githubusercontent.com/FlexGamesGitHub/VoiceActivity/main/server/version_data.json').getBody('utf8'));
    
    for (var file in version_data) {
        if (version_data[file] != local_versions[file]) {
            if (file == "start_script") { console.log(`! - Manual Update required\n! - Please copy the content of https://raw.githubusercontent.com/FlexGamesGitHub/VoiceActivity/main/src/_start.js to ./_start.js`); return false }
            else if (file == "other") {}
            else {
                console.log(`Updating ${file} to ${version_data[file]}...`);

                if (file == "config.json") {
                    var config_update = JSON.parse(request('GET', 'https://raw.githubusercontent.com/FlexGamesGitHub/VoiceActivity/main/server/config_update.json').getBody('utf8'));
                    if (fs.readFileSync("./config.json", 'utf8').length < 350) {
                        var config_template = JSON.parse(request('GET', 'https://raw.githubusercontent.com/FlexGamesGitHub/VoiceActivity/main/src/config.json').getBody('utf8'));

                        fs.writeFileSync("./"+file, JSON.stringify(config_template));

                        var config_pre = config_template;
                        
                        console.log('Setting up Config...');
                        config_pre['t'] = rLSync.question('Token? > ');
                        config_pre['moderating_whitelist'] = rLSync.question('List of moderators (separated with comma space) > ').split(', ');
                        config_pre['guild_id'] = rLSync.question('The guild id the bot shall run > ');
                        config_pre['log_channel_id'] = rLSync.question('A private Logging Channel ID > ');
                        config_pre['logging_level'] = (r = rLSync.question('Logging Level (Enter = 4, Explanation in Wiki) > ')) ? parseInt(r) : 4;

                        fs.writeFileSync("./"+file, JSON.stringify(config_pre));
                    }
                }
                else var new_data = request('GET', 'https://raw.githubusercontent.com/FlexGamesGitHub/VoiceActivity/main/src/'+file).getBody('utf8');

                if (file == "config.json") {
                    for (var action in config_update) {
                        if (action == "set") {
                            for (var entry in config[action]) {
                                config[entry] = config_update[action][entry];
                            }
                        } 
                        else if (action == "remove") {
                            for (var i = 0; i < config_update[action].length; i++) delete config[config_update[action][i]];
                        }
                    }
                }
                else {
                    try { fs.writeFileSync("./"+file, new_data); }
                    catch (e) { console.error(`Update of ${file} failed: ${e}`) }
                }
            }
        }
    }
    for (i = 0; i < (fn = fs.readdirSync('./')).length; i++) if (!((version_data.hasOwnProperty(fn[i])) || (version_data.other.includes(fn[i])) || fn[i] == "_start.js")) console.log(`File ${fn[i]} is no longer needed, you can delete it`);

    fs.writeFileSync("./version_data.json", JSON.stringify(version_data));

    if (logout) {
        bot.destroy();
        main.start();
    }
    return true;
}

if (startUp(null, false)) {
    const main = require('./main.js');
    main.start();
}


const sleep = ms => new Promise(r => setTimeout(r, ms));


async function check_loop(bot) {
    while (true) {
        await sleep(3600000);

        var version_data = JSON.parse(request('GET', 'https://raw.githubusercontent.com/FlexGamesGitHub/VoiceActivity/main/server/version_data.json').getBody('utf8'));
    
        if (version_data != require('./version_data.json')) startUp(bot, true);
    }
}
module.exports.check_loop = check_loop;
