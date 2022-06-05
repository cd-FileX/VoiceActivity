const dsc = require('discord.js');
const { Logging } = require('./Logging.ts');
const json = require('./JSON_Funcs.ts');

var active_time, d, i, x, l_date, t_m, emb, leaderboard, b_msg, members, pg,
    leaderboards = {};
    
const scroll_row = [
    {
        type: 1,
        components: [{
            type: 2,
            label: "Previous Page",
            style: 4,
            emoji: "◀",
            custom_id: "leaderboard-prev",
            disabled: true
        },
        {
            type: 2,
            label: "Go To",
            style: 1,
            emoji: "🔎",
            custom_id: "leaderboard-goto"
        },
        {
            type: 2, 
            label: "Next Page",
            style: 3,
            emoji: "▶",
            custom_id: "leaderboard-next", 
            disabled: false
        }]
    }
]


async function respond_leaderboard(bot, config, caller, cmd) {
    if (config.moderating_whitelist.includes(caller.member.id)) {
        if (!cmd && caller.content.split('.')[1]) l_date = caller.content.split('.')[1];
        else if (cmd) l_date = caller.options.get('date_or_all').value;
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
        
            b_msg = await caller.reply({embeds: [await get_leaderboard_page(bot, emb, sumed_up_l, 1, 2)], components: scroll_row, fetchReply: true});
            leaderboards[b_msg.id] = {page: 1, date: "LAST 7 DAYS"};
            return;
        } 

        try {
            l_date = new Date(l_date).toDateString();
            if (l_date == "Invalid Date") throw Error;
        } catch (e) {
            emb = new dsc.MessageEmbed({title: "Wrong Date Format", 
                    description: "_leaderboard.[DATE: [Words](https://flexgamesgithub.github.io/FlexBot/#param-type-wörter)] (Website is german)\n[leaderboard in Wiki](https://github.com/FlexGamesGitHub/VoiceActivity/wiki/THE-COMMANDS#_leaderboarddate-words)", 
                    color: config.danger_color});
            return caller.reply({embeds: [emb]});
        }
        
        leaderboard = json.read(new json.Files().BOARD, [l_date]);
        if (!leaderboard) {
            emb = new dsc.MessageEmbed({title: "No data for that date", 
                    description: "_leaderboard.[DATE: [Words](https://flexgamesgithub.github.io/FlexBot/#param-type-wörter)] (Website is german)\n[leaderboard in Wiki](https://github.com/FlexGamesGitHub/VoiceActivity/wiki/THE-COMMANDS#_leaderboarddate-words)", 
                    color: config.danger_color});
            return caller.reply({embeds: [emb]});
        }
        
        emb = new dsc.MessageEmbed({title: "LEADERBOARD OF "+l_date, description: "TIME is only while the user is not muted and Final = Time - Muted", color: config.bot_color});
        
        b_msg = await caller.reply({embeds: [await get_leaderboard_page(bot, emb, leaderboard, 1, 2)], components: scroll_row, fetchReply: true});
        leaderboards[b_msg.id] = {page: 1, date: l_date};

    } else {
        emb = new dsc.MessageEmbed({title: "You have no access to this function", color: config.danger_color});
        caller.reply({embeds: [emb]});
    }
}
module.exports.respond_leaderboard = respond_leaderboard;


async function get_leaderboard_page(bot, emb, leaderboard, sort, sort_type) {
    leaderboard.sort((a, b) => {
        return (b.time - b.muted) - (a.time - a.muted);
    });
    (await (await (await bot.guilds.fetch(json.read(new json.Files().CONFIG, ['guild_id']))).fetch()).members.fetch()).forEach(v => { if (!v.user.bot && !leaderboard.some(l => l.id == v.id)) leaderboard.push({id: v.id, time: 0, muted: 0}) });
    
    for (i = 0; i < leaderboard.length; i++) leaderboard[i].place = i+1;

    var  places = "", users = "", time = "";

    if (sort_type == 1) {
        var pos = leaderboard.map((v) => {
            return v.id
        }).indexOf(sort)+1;
        if (pos != 0) {
            sort = Math.ceil(pos/10);
            sort_type = 2;
        } else {
            emb.setFooter({text: "The given user was not found in the leaderboard", iconURL: "https://i.imgur.com/AyGmqfA.png"})
            sort = 1;
            sort_type = 2;
        }
    }
    var leaderboard_max_p = Math.ceil((leaderboard.length+1)/10);

    leaderboard = sort <= leaderboard_max_p ? leaderboard.slice((sort*10)-10, sort*10) : leaderboard.slice(leaderboard.indexOf(leaderboard[-1])-10, leaderboard.indexOf(leaderboard[-1]));

    for (i = 0; i < leaderboard.length; i++) {
        users += `<@${leaderboard[i].id}>\n`;
        time += `${leaderboard[i].time.toString()} | ${leaderboard[i].muted.toString()} | ${(t_m = leaderboard[i].time - leaderboard[i].muted) > 0 ? t_m.toString() : "0"} mins\n`;
        places += leaderboard[i].place.toString()+'\n'
    }
    
    emb.title += (` | PAGE ${(sort ? sort.toString() : "")}/${leaderboard_max_p}`);
    emb.addFields({name: "PLACE", value: places, inline: true}, {name: "USER", value: users, inline: true}, {name: "TIME | MUTED | FINAL", value: time, inline: true});
    
    scroll_row[0].components[0].disabled = sort <= 1; scroll_row[0].components[2].disabled = (sort >= leaderboard_max_p);

    return emb;
}
module.exports.get_leaderboard_page = get_leaderboard_page;


async function page_scroll(bot, config, interact) {
    if (config.moderating_whitelist.includes(interact.member.id)) {
        if (!leaderboards[interact.message.id]) 
            return interact.message.edit({embeds: [(new dsc.MessageEmbed({title: "OUTDATED LEADERBOARD", description: "This is a leaderboard from an old session of the bot. Please request a new one.", color: config.danger_color}))]});
        
        if (interact.customId == "leaderboard-prev" && leaderboards[interact.message.id].page != 1) {
            if (leaderboards[interact.message.id].date == "LAST 7 DAYS") {
                leaderboard = json.read(new json.Files().BOARD, '');
                var sumed_up_l = [];

                for (var date in leaderboard) {
                    for (i = 0; i < leaderboard[date].length; i++) {
                        if (!sumed_up_l[i]) sumed_up_l[i] = {id: leaderboard[date][i].id, time: 0, muted: 0};
                        sumed_up_l[i].time += leaderboard[date][i].time;
                        sumed_up_l[i].muted += leaderboard[date][i].muted;
                    }
                }
                leaderboard = sumed_up_l;
            }
            else leaderboard = json.read(new json.Files().BOARD, [leaderboards[interact.message.id].date]);

            emb = new dsc.MessageEmbed({title: "LEADERBOARD OF "+leaderboards[interact.message.id].date, description: "TIME is only while the user is not muted and Final = Time - Muted", color: config.bot_color});

            interact.message.edit({embeds: [await get_leaderboard_page(bot, emb, leaderboard, (leaderboards[interact.message.id].page -= 1), 2)], components: scroll_row});
        }
        else if (interact.customId == "leaderboard-next") {
            if (leaderboards[interact.message.id].date == "LAST 7 DAYS") {
                leaderboard = json.read(new json.Files().BOARD, '');
                var sumed_up_l = [];

                for (var date in leaderboard) {
                    for (i = 0; i < leaderboard[date].length; i++) {
                        if (!sumed_up_l[i]) sumed_up_l[i] = {id: leaderboard[date][i].id, time: 0, muted: 0};
                        sumed_up_l[i].time += leaderboard[date][i].time;
                        sumed_up_l[i].muted += leaderboard[date][i].muted;
                    }
                }
                leaderboard = sumed_up_l;
            }
            else leaderboard = json.read(new json.Files().BOARD, [leaderboards[interact.message.id].date]);

            emb = new dsc.MessageEmbed({title: "LEADERBOARD OF "+leaderboards[interact.message.id].date, description: "TIME is only while the user is not muted and Final = Time - Muted", color: config.bot_color});
            
            interact.message.edit({embeds: [await get_leaderboard_page(bot, emb, leaderboard, (leaderboards[interact.message.id].page += 1), 2)], components: scroll_row});
        }
        else if (interact.customId == "leaderboard-goto-submit") {
            if (leaderboards[interact.message.id].date == "LAST 7 DAYS") {
                leaderboard = json.read(new json.Files().BOARD, '');
                var sumed_up_l = [];

                for (var date in leaderboard) {
                    for (i = 0; i < leaderboard[date].length; i++) {
                        if (!sumed_up_l[i]) sumed_up_l[i] = {id: leaderboard[date][i].id, time: 0, muted: 0};
                        sumed_up_l[i].time += leaderboard[date][i].time;
                        sumed_up_l[i].muted += leaderboard[date][i].muted;
                    }
                }
                leaderboard = sumed_up_l;
            }
            else leaderboard = json.read(new json.Files().BOARD, [leaderboards[interact.message.id].date]);

            emb = new dsc.MessageEmbed({title: "LEADERBOARD OF "+leaderboards[interact.message.id].date, description: "TIME is only while the user is not muted and Final = Time - Muted", color: config.bot_color});
            
            var gt_u = interact.fields.getTextInputValue('leaderboard-goto-user'), gt_p = interact.fields.getTextInputValue('leaderboard-goto-page');
            if (!interact.fields.getTextInputValue('leaderboard-goto-user')) leaderboards[interact.message.id].page = (1 <= (pg = parseInt(gt_p)) ? pg < Math.ceil((leaderboard.length+1) / 10) ? pg : Math.ceil((leaderboard.length+1) / 10) : 1);
            
            interact.message.edit({embeds: [await get_leaderboard_page(bot, emb, leaderboard, (gt_u ? 
                /^\d+$/.test(gt_u) ?  // Testet auf ob nur Nummern = ID
                    gt_u : (await(await(await bot.guilds.fetch(json.read(new json.Files().CONFIG, ['guild_id']))).fetch()).members.search({query: gt_u})).at(0).id 
                    : (1 <= (pg = parseInt(gt_p)) ? 
                        pg < Math.ceil((leaderboard.length+1) / 10) ? pg : Math.ceil((leaderboard.length+1) / 10) : 1))
                , (gt_u ? 1 : 2))], components: scroll_row});
        }
        await interact.deferUpdate();
    }
}
module.exports.page_scroll = page_scroll;
