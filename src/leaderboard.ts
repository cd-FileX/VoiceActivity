const dsc = require('discord.js');
const { Logging } = require('./Logging.ts');
const json = require('./JSON_Funcs.ts');

var active_time, d, i, x, l_date, t_m, emb, leaderboard, b_msg, members,
    leaderboards = {};
    
const scroll_row = [
    {
        type: 1,
        components: [{
            type: 2,
            label: "Previous Page",
            style: 1,
            emoji: "◀",
            custom_id: "leaderboard-prev",
            disabled: true
        },
        {
            type: 2, 
            label: "Next Page",
            style: 1,
            emoji: "▶",
            custom_id: "leaderboard-next", 
            disabled: false
        }]
    },
    {
        type: 1,
        components: [{
            type: 4,
            label: "Go To",
            min_length: 1,
            value: "1",
            placeholder: "Page",
            style: 1,
            custom_id: "leaderboard-goto"
        }]
    }
]


async function respond_leaderboard(bot, config, caller, cmd) {
    if (config.moderating_whitelist.includes(caller.member.id)) {
        if (!cmd && caller.content.split('.')[1]) l_date = caller.content.split('.')[1];
        else if (cmd) l_date = caller.options.get('date');
        else {
            emb = new dsc.MessageEmbed({title: "You forgot the date", 
                description: "_leaderboard.[DATE: [Words](https://flexgamesgithub.github.io/FlexBot/#param-type-wörter)] (Website is german)\n[leaderboard in Wiki](https://github.com/FlexGamesGitHub/VoiceActivity/wiki/THE-COMMANDS#_leaderboarddate-words)", 
                color: config.danger_color});
            return caller.reply({embeds: [emb]});
        }
        if (l_date == 'all') {
            leaderboard = json.read(new json.Files().BOARD, '');
            var sumed_up_l = [];

            for (var date in leaderboard) {
                for (i = 0; i < leaderboard[date].length; i++) {
                    if (!sumed_up_l[i]) sumed_up_l[i] = {id: leaderboard[date][i].id, time: 0, muted: 0};
                    sumed_up_l[i].time += leaderboard[date][i].time;
                    sumed_up_l[i].muted += leaderboard[date][i].muted;
                }
            }
            
            emb = new dsc.MessageEmbed({title: "LEADERBOARD OF LAST 7 DAYS", description: "TIME is only while the user is not muted and Final = Time - Muted", color: config.bot_color});
        
            b_msg = await caller.reply({embeds: [get_leaderboard_page(bot, emb, sumed_up_l, 1)]});
            leaderboards[b_msg.id] = {page: 1, date: "LAST 7 DAYS"};
            return;
        } 

        try {
            l_date = new Date(l_date).toDateString();
        } catch (e) {
            emb = new dsc.MessageEmbed({title: "Wrong Date Format", 
                    description: "_leaderboard.[DATE: [Words](https://flexgamesgithub.github.io/FlexBot/#param-type-wörter)] (Website is german)\n[leaderboard in Wiki](https://github.com/FlexGamesGitHub/VoiceActivity/wiki/THE-COMMANDS#_leaderboarddate-words)", 
                    color: config.danger_color});
            return caller.reply({embeds: [emb]});
        }

        leaderboard = json.read(new json.Files().BOARD, [l_date]);
        if (!leaderboard) {
            emb = new dsc.MessageEmbed({title: "Wrong Date", 
                    description: "_leaderboard.[DATE: [Words](https://flexgamesgithub.github.io/FlexBot/#param-type-wörter)] (Website is german)\n[leaderboard in Wiki](https://github.com/FlexGamesGitHub/VoiceActivity/wiki/THE-COMMANDS#_leaderboarddate-words)", 
                    color: config.danger_color});
            return caller.reply({embeds: [emb]});
        }
        
        emb = new dsc.MessageEmbed({title: "LEADERBOARD OF "+l_date, description: "TIME is only while the user is not muted and Final = Time - Muted", color: config.bot_color});
        
        scroll_row[0].components[0].disabled = true; scroll_row[0].components[1].disabled = false;
        b_msg = await caller.reply({embeds: [await get_leaderboard_page(bot, emb, leaderboard, 1)]});
        leaderboards[b_msg.id] = {page: 1, date: l_date};

    } else {
        emb = new dsc.MessageEmbed({title: "You have no access to this function", color: config.danger_color});
        caller.reply({embeds: [emb]});
    }
}
module.exports.respond_leaderboard = respond_leaderboard;


async function get_leaderboard_page(bot, emb, leaderboard, page) {
    leaderboard.sort((a, b) => {
        return (a.time - a.muted) - (b.time - b.muted);
    });
    
    for (i = 0; i < (members = await bot.guilds.cache.get(json.read(new json.Files().CONFIG, ['guild_id'])).members.list()).length; i++) leaderboard.push({id: members[i].id, time: 0, muted: 0});
    
    for (i = 0; i < leaderboard.length; i++) leaderboard[i].place = i;

    var users = "", time = "", muted = "", final = "", places = "";

    leaderboard = (leaderboard.length / 10) + 1 - page >= 0 ? leaderboard.slice((page*10)-10, page*10) : leaderboard.slice(leaderboard.indexOf(leaderboard[-1])-10, leaderboard.indexOf(leaderboard[-1]));

    for (i = 0; i < leaderboard.length; i++) {
        users += `<@${leaderboard[i].id}>\n`;
        time += leaderboard[i].time.toString()+'\n';
        muted += leaderboard[i].muted.toString()+'\n';
        final += (t_m = leaderboard[i].time - leaderboard[i].muted) > 0 ? t_m.toString()+'\n' : "0\n"
        places += leaderboard[i].place.toString()+'\n'
    }
    emb.title += " PAGE " + page ? page.toString() : "";
    emb.addFields({name: "PLACE", value: places, inline: false}, {name: "USER", value: users, inline: false}, {name: "TIME", value: time, inline: false}, {name: "MUTED", value: muted, inline: false}, {name: "FINAL", value: final, inline: false});
    
    return emb;
}
module.exports.get_leaderboard_page = get_leaderboard_page;

// TEXT_FIELD__TODO
async function page_scroll(bot, config, interact) {
    if (config.moderating_whitelist.includes(interact.member.id)) {
        if (interact.customId == "leaderboard-prev" && !interact.message.embeds[0].title.endswith('1')) {
            leaderboard = json.read(new json.Files().BOARD, [leaderboards[interact.message.id].date]);

            emb = new dsc.MessageEmbed({title: "LEADERBOARD OF "+leaderboards[interact.message.id].date, description: "TIME is only while the user is not muted and Final = Time - Muted",color: config.bot_color});

            scroll_row[0].components[0].disabled = leaderboards[interact.message.id].page <= 2; scroll_row[0].components[1].disabled = false;
            interact.message.edit({embeds: [await get_leaderboard_page(bot, emb, leaderboard, (leaderboards[interact.message.id].page -= 1))]});
        }
        else if (interact.custom_id == "leaderboard-next") {
            leaderboard = json.read(new json.Files().BOARD, [leaderboards[interact.message.id].date]);

            emb = new dsc.MessageEmbed({title: "LEADERBOARD OF "+leaderboards[interact.message.id].date, description: "TIME is only while the user is not muted and Final = Time - Muted", color: config.bot_color});

            scroll_row[0].components[0].disabled = false; scroll_row[0].components[1].disabled = false;
            interact.message.edit({embeds: [await get_leaderboard_page(bot, emb, leaderboard, (leaderboards[interact.message.id].page += 1))]});
        }
        else if (interact.custom_id == "leaderboard-goto") {
            leaderboard = json.read(new json.Files().BOARD, [leaderboards[interact.message.id].date]);

            emb = new dsc.MessageEmbed({title: "LEADERBOARD OF "+leaderboards[interact.message.id].date, description: "TIME is only while the user is not muted and Final = Time - Muted", color: config.bot_color});
            
            scroll_row[0].components[0].disabled = false; scroll_row[0].components[1].disabled = false;
            interact.message.edit({embeds: [await get_leaderboard_page(bot, emb, leaderboard, (interact.fields.getTextInputValue('leaderboard-goto')))]});
        }
    }
}
module.exports.page_scroll = page_scroll;
