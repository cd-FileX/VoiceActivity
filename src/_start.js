// sync-request, discord.js, @discordjs/rest, discord-api-types/v9, fs

const fs = require('fs');
const request = require('sync-request');


function startUp() { 
    if (!fs.existsSync('./config.json')) fs.writeFileSync('./config.json', "{}");
    const config = require('./config.json');
    if (!fs.existsSync('./version_data.json')) fs.writeFileSync('./version_data.json', JSON.stringify({"config.json": "0.0.0", "JSON_Funcs.ts": "0.0.0", "Logging.ts": "0.0.0", "main.js": "0.0.0", "VoiceActivity_Func.ts": "0.0.0", "manual_update": false}));
    const local_versions = require('./version_data.json');
    if (!fs.existsSync('./last_active.json', 'r')) fs.writeFileSync('./last_active.json', "{}");
    // GITHUB_EINRICHTEN__TODO

    var version_data = JSON.parse(request('GET', 'https://raw.githubusercontent.com/FlexGamesGitHub/VoiceActivity/main/server/version_data.json').getBody('utf8'));

    for (var file in version_data) {
        if (version_data[file] != local_versions[file]) {
            if (file == "manual_update") { if (version_data[file] == true) console.log("! - Manual Update required\n! - Please copy the content of https://raw.githubusercontent.com/FlexGamesGitHub/VoiceActivity/main/src/_start.js to ./_start.js") }
            else {
                console.log(`Updating ${file} to ${version_data[file]}...`);

                if (file == "config") {
                    var config_update = JSON.parse(request('GET', 'https://raw.githubusercontent.com/FlexGamesGitHub/VoiceActivity/main/server/config_update.json').getBody('utf8'));

                    if (fs.readFileSync("./config.json", 'utf8').length < 350) {
                        var config_template = JSON.parse(request('GET', 'https://raw.githubusercontent.com/FlexGamesGitHub/VoiceActivity/main/src/config.json').getBody('utf8'));

                        fs.writeFile("./"+file, config_template.responseText);

                        var config_pre = JSON.parse(config_template.responseText);
                        
                        console.log('Setting up Config...');
                        config_pre['t'] = prompt('Token? > ');
                        config_pre['moderating_whitelist'] = prompt('List of moderators (separated with comma space) > ').split(', ');
                        config_pre['guild_id'] = prompt('The guild id the bot shall run > ');
                        config_pre['log_channel_id'] = prompt('A private Logging Channel ID > ');
                        config_pre['logging_level'] = prompt('Logging Level (Enter = 4, Explanation in Wiki) > ', "4");

                        fs.writeFile("./"+file, JSON.stringify(config_pre));
                    }
                }
                else var new_data = request('GET', 'https://raw.githubusercontent.com/FlexGamesGitHub/VoiceActivity/main/src/'+file).getBody('utf8');

                if (file == "config") {
                    for (var action in config_update) {
                        if (action == "set") {
                            for (var entry in config[action]) {
                                config[entry] = config_update[action][entry];
                            }
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
    fs.writeFileSync("./version_data.json", JSON.stringify(version_data));
}

startUp();
const main = require('./main.js');
main.start();


async function check_loop() {
    var version_data = JSON.parse(request('GET', 'https://raw.githubusercontent.com/FlexGamesGitHub/VoiceActivity/main/server/version_data.json').getBody('utf8'));

    if (version_data != require('./version_data.json')) startUp();
}
module.exports.check_loop = check_loop;
