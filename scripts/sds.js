//////////////////////////////////////    CLASSES    //////////////////////////////////////    
// Window Class
class ChartWindow extends Application {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            id: "sds-winapp",
            template: "modules/simple-dice-stats/templates/sds.hbs",
            title: "D20 STATISTICS",
            classes: ["sds-chart"],
            popOut: true,
            resizable: false,
            width: 800,
            height: 450
        });
    }

    getData() {

        let theuser = game.users.contents.filter(user => user.isOwner)[0].name;
        let datarange = Object.keys(game.users.contents.find(f => f.name === theuser)['flags']['simple-dice-stats']['d20stats']);

        let whichuser = wus();

        let p = updatedata(datarange[0], datarange[datarange.length - 1], theuser);

        let usermostd20 = MoreInRange(datarange[0], datarange[datarange.length - 1], 20);
        let usermostd1 = MoreInRange(datarange[0], datarange[datarange.length - 1], 1);

        let dates = populatedates(theuser);

        let svgicon = d20icon(game.users.contents.filter(user => user.isOwner)[0].color);

        let dicelabels = "";
        for (var i = 0; i < 20; i++) {
            dicelabels = dicelabels + '<div class="dicenlabel"><div class="bar-label" >' + (i + 1) + '</div></div>';
        }

        return {
            usermostd20: usermostd20,
            usermostd1: usermostd1,
            nat1s: p['nat1s'],
            nat20s: p['nat20s'],
            att20s: p['att20s'],
            att1s: p['att1s'],
            totalrolls: p['totalrolls'],
            whichuser: whichuser,
            svgicon: svgicon,
            appcontent: p['appcontent'],
            messagealldatesfrom: dates['messagealldatesfrom'],
            messagealldatesto: dates['messagealldatesto'],
            chartitle: p['chartitle'],
            dicelabels: dicelabels,
            titlecolor: p['titlecolor']
        };
    }
    //selectuser
    activateListeners(html) {
        super.activateListeners(html);

        let theuser = game.users.contents.filter(user => user.isOwner)[0].name;

        $("#selectuser option[value='" + theuser + "']").prop("selected", true);
        $("#fromdateselect option:first").prop("selected", true);
        $("#todateselect option:last").prop("selected", true);

        // Changing user
        $('#selectuser').change(ev => {

            let theuser = $("#selectuser").val();

            let prevfrom = $('select[name="datefrom"] option:selected').text();
            let prevto = $('select[name="dateto"] option:selected').text();

            let dates = populatedates(theuser);

            $("#fromdateselect").html(dates['messagealldatesfrom']);
            $("#todateselect").html(dates['messagealldatesto']);

            $("#fromdateselect option[value='" + prevfrom + "']").prop("selected", true);
            $("#todateselect option[value='" + prevto + "']").prop("selected", true);

            updatechartonchange();

        });
        // Changing "from" date
        $('#fromdateselect').change(ev => {
            updatechartonchange();
        });
        // Changing "to" date
        $('#todateselect').change(ev => {
            updatechartonchange();
        });
    }
}

// A class to create list of rolls with methods to update them
class UserDices {
    constructor(username) {
        this.username = username;
        this.totalRolls = 0;
        this.attacks20 = 0;
        this.attacks1 = 0;
        this.diceRolls = new Array(20).fill(0); // Initialize an array of 20 elements all set to 0        
    }

    // Method to increment the count of a specific dice roll
    incrementDiceRoll(diceNumber) {
        if (diceNumber >= 1 && diceNumber <= 20) {
            this.diceRolls[diceNumber - 1]++;
            this.totalRolls++;
        }
    }

    // Method to increment the count of a specific dice roll
    incrementAttacks(diceNumber) {
        if (diceNumber === 1) {
            this.attacks1++;
        }
        if (diceNumber === 20) {
            this.attacks20++;
        }
    }

    // Method to get the count of a specific dice roll
    getDiceRollCount(diceNumber) {
        if (diceNumber >= 1 && diceNumber <= 20) {
            return this.diceRolls[diceNumber - 1];
        }
        return null;
    }
}
// Class to create a button to reset all dice data 
class ResetButton extends FormApplication {
    static get defaultOptions() {
        const defaults = super.defaultOptions;
        const overrides = {
            id: "reset-button",
            title: "Reset alld dice data",
            template: "modules/simple-dice-stats/templates/reset-button.hbs",
            width: 200,
            closeOnSubmit: true
        }
        return mergeObject(defaults, overrides);
    }

    getData() {
        return {
            btnmessage: "CONFIRM"
        };
    }

    async _updateObject(event, formData) {
        let usnames = game.users.contents.map(obj => obj.name);
        let currentDate = new Date();
        let dateString = currentDate.toLocaleDateString('en-GB');
        let d20sbydate = { [dateString]: new UserDices() }

        for (let element of usnames) {
            await game.users.contents.find(f => f.name === element).unsetFlag('simple-dice-stats', 'd20stats');
            await game.users.contents.find(f => f.name === element).setFlag('simple-dice-stats', 'd20stats', d20sbydate);
        }
    }
}
//////////////////////////////////////    HOOKS    //////////////////////////////////////   


Hooks.once('init', function () {

    game.settings.register('simple-dice-stats', 'allowhiddenrolls', {
        name: 'Allow to save hidden rolls',
        hint: 'ONLY PUBLIC ROLLS ARE SAVED IF DISABLED. The hidden rolls made when this option is disabled will not be available when you enable it. ',
        scope: 'world',
        config: true,
        type: Boolean,
        default: true,
        restricted: true
    });

    game.settings.register('simple-dice-stats', 'allowviewgmrolls', {
        name: 'Allow players to see GM rolls',
        scope: 'world',
        config: true,
        type: Boolean,
        default: true,
        restricted: true
    });

    game.settings.register('simple-dice-stats', 'pausedataacq', {
        name: 'Pause the acquisition of data',
        hint: 'While this is enabled, no roll data will be stored',
        scope: 'world',
        config: true,
        type: Boolean,
        default: false,
        restricted: true
    });

    //Reset Natural 1 list variable to default
    game.settings.registerMenu('simple-dice-stats', 'reset-alldata', {
        name: "Reset all dice data",
        label: "Reset all dice data",
        hint: "All users rolled data will be deleted",
        icon: "fas fa-undo",
        type: ResetButton,
        restricted: true,
    });

});


Hooks.on("ready", function () {

    let usnames = game.users.contents.map(obj => obj.name);

    usnames.forEach(element => {

        let currentDate = new Date();
        let dateString = currentDate.toLocaleDateString('en-GB');


        if (!game.users.contents.find(f => f.name === element).getFlag('simple-dice-stats', 'd20stats')) {

            let d20sbydate = {

                [dateString]: new UserDices()
            }

            game.users.contents.find(f => f.name === element).setFlag('simple-dice-stats', 'd20stats', d20sbydate);

        }
    });

    if (game.settings.get('simple-dice-stats', 'pausedataacq')) {

        ui.notifications.warn('Simple d20 statistics: Saving roll data is disabled');

        if (game.user.isGM) {

            ChatMessage.create({
                content: '<div class="sdsdisabled"><img style="width: 40px; height:40px; border:none;" src="../../../icons/svg/d20-grey.svg"><b><u>Simple d20 statistics:</u> <br> Saving roll data is disabled</b><br></div>',
                //speaker: { alias: " GM " } 
                //speaker: ChatMessage.getSpeaker(),
            });

        }

    }
});

// Boton en el panel izquierdo
Hooks.on('getSceneControlButtons', function (controls) {
    let bar = controls.find(c => c.name === 'token');

    bar.tools.push({
        name: "dices",
        title: 'Your d20 statistics',
        icon: 'fas fa-dice-d20', // choose your icon
        onClick: () => new ChartWindow().render(true),
        button: true
    });
});

/************************************************** CHAT DICE HOOKS ***********/
// If dice so nice is not active    
Hooks.on("createChatMessage", (chatMessage) => {
    if (!game.modules.get("dice-so-nice")?.active) {

        if (!chatMessage.rolls[0]) {
            return;
        }

        if (game.settings.get('simple-dice-stats', 'pausedataacq')) {
            return;
        }

        detectroll(chatMessage);
    }
});

// If dice so nice is active
Hooks.on('diceSoNiceRollComplete', (data) => {

    let chatMessage = game.messages.get(data);

    if (game.settings.get('simple-dice-stats', 'pausedataacq')) {
        return;
    }

    detectroll(chatMessage);
});

//////////////////////////////////////    FUNCTIONS    ////////////////////////////////////// 

// updates the flag of the user containing all the rolled dices
function detectroll(chatMessage) {

    // If the current user is not the one who rolled the dice, do nothing
    if (chatMessage.user._id !== game.user._id) {
        return;
    }

    let d20dices = chatMessage.rolls[0].dice;
    let userwhorolled = chatMessage.user.name;
    let isattack = false;

    if (game.system.id === 'pf2e') {

        if (chatMessage.rolls[0]['type'] === 'attack-roll') {
            isattack = true;
        }
    }

    if (game.system.id === 'dnd5e') {
        let atstring = chatMessage.flavor;
        if (atstring.includes('Attack Roll')) {
            isattack = true;
        }
    }

    let rolltype = 0; // 0-Public, 1-Blind , 2-PrivateGM, 3-Self

    // If the roll is not public it is whisper 
    if (chatMessage.whisper.length !== 0) {

        // The roll is blind
        if (chatMessage.blind) {
            rolltype = 1; // Blind Roll 
        } else {
            //The roll was whispered to the GM
            if (chatMessage.whisper[0] === game.users.contents.find(f => f.name === 'Gamemaster').id) {
                rolltype = 2; //Private GM
            }
            //The roll was whispered to himself
            if (chatMessage.whisper[0] === chatMessage.user._id) {
                rolltype = 3; // selfRoll
            }
        }
    }

    if (rolltype !== 0 && !game.settings.get('simple-dice-stats', 'allowhiddenrolls')) {
        return;
    }

    d20dices.forEach((element) => {

        let currentDate = new Date();
        let dateString = currentDate.toLocaleDateString('en-GB');

        if (element.faces === 20) {

            let userflag = game.users.contents.find(f => f.name === userwhorolled).getFlag('simple-dice-stats', 'd20stats');

            let thisrolleval = new UserDices(userwhorolled);

            if (userflag[dateString]) {

                thisrolleval['diceRolls'] = userflag[dateString]['diceRolls'];
                thisrolleval['totalRolls'] = userflag[dateString]['totalRolls'];
                thisrolleval['attacks1'] = userflag[dateString]['attacks1'];
                thisrolleval['attacks20'] = userflag[dateString]['attacks20'];


            } else {
                userflag[dateString] = {};
            }

            element.results.forEach((abc) => {

                thisrolleval.incrementDiceRoll(abc.result);
                if (isattack) {
                    thisrolleval.incrementAttacks(abc.result);
                }
            });

            userflag[dateString]['diceRolls'] = thisrolleval['diceRolls'];
            userflag[dateString]['totalRolls'] = thisrolleval['totalRolls'];
            userflag[dateString]['attacks20'] = thisrolleval['attacks20'];
            userflag[dateString]['attacks1'] = thisrolleval['attacks1'];

            game.users.contents.find(f => f.name === userwhorolled).setFlag('simple-dice-stats', 'd20stats', userflag);

        }
    });
}

// Populate the chart
function updatedata(datefrom, dateto, theuser) {

    //let theusercolor = game.users.contents.filter(user => theuser)[0].color;
    let theusercolor = game.users.contents.find(f => f.name === theuser).color;

    let userflag = game.users.contents.find(f => f.name === theuser).getFlag('simple-dice-stats', 'd20stats');

    let result = sumInRange(userflag, datefrom, dateto);

    let totalrolls = result.a;
    let alldicedata = result.b;
    let att20s = result.c;
    let att1s = result.d;

    let maxtoactualproportion = 0;
    let alldicedatanormalized = new Array(20).fill(0);
    let appcontent = "";

    // let chartitle = theuser + ' has rolled ' + totalrolls + ' d20s!';
    let chartitle = theuser + ' d20s!';
    let adindex = 0;
    let maxrolledvalue = Math.max(...alldicedata);
    let dicepercentage = new Array(20).fill(0);

    let svgicon = d20icon(theusercolor);

    alldicedata.forEach(element => {

        alldicedatanormalized[adindex] = Math.round((100 * element) / maxrolledvalue);
        dicepercentage[adindex] = Math.round((10000 * element) / totalrolls) / 100;

        maxtoactualproportion = alldicedatanormalized[adindex];

        if (totalrolls !== 0) {

            appcontent = appcontent + '<div class=" bar-container" style="height: 160px;"><div data-hover-text="' + dicepercentage[adindex] + '%" class="bar" id="bar' + (adindex + 1) + '" style="height: ' + maxtoactualproportion + '%; background-color: ' + theusercolor + '; "><div class="bar-number" id="rolltotal' + (adindex + 1) + '" style="text-shadow: 0 0 4px ' + theusercolor + ';">' + element + '</div></div></div>';

            //' + svgicon + ' to add a dice of user color with a  <svg> tag
            // style="color:'+ theusercolor +';"
        }
        adindex = adindex + 1;
    });

    adindex = 0;

    let titlecolor = '"color: ' + theusercolor + ';"';

    // When a player has not rolled any dice in the requested date
    if (totalrolls === 0) {
        for (var i = 1; i < 21; i++) {

            appcontent = appcontent + '<div class=" bar-container" style="height: 160px;"><div data-hover-text="0%" class="bar" id="bar' + i + '" style="height: 0%; background-color: ' + theusercolor + '; "><div class="bar-number" id="rolltotal' + i + '" style="text-shadow: 0 0 4px ' + theusercolor + ';">0</div></div></div>';
        }
    }


    return {
        nat1s: alldicedata[0],
        nat20s: alldicedata[19],
        totalrolls: totalrolls,
        att20s: att20s,
        att1s: att1s,
        svgicon: svgicon,
        titlecolor: titlecolor,
        appcontent: appcontent,
        chartitle: chartitle
    };
}

// Create a list of option of users
function wus() {

    let usnames = game.users.contents.map(obj => obj.name);

    let whichuser = '';

    for (var i = 0; i < (usnames.length); i++) {
        whichuser = whichuser + '<option value=' + usnames[i] + '>' + usnames[i] + '</option>';
    }
    let gmid = game.users.contents.find(f => f.name === 'Gamemaster').id;

    if (!game.settings.get('simple-dice-stats', 'allowviewgmrolls') && game.user._id !== gmid) {
        let valuetodelete = '<option value=Gamemaster>Gamemaster</option>';
        whichuser = whichuser.replace(valuetodelete, '');
    }

    return whichuser;
}

// A function to create a d20 svg with the color of the user
function d20icon(theusercolor) {

    let usicon = '<svg class="mysvgdice" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 320" width="52" height="52" style="transform: rotate(180deg);"><g transform="translate(-246.69456,-375.66745)"> <path fill=' + theusercolor + ' d="M379.93,375.668c-0.57,0.019-1.226,0.228-1.585,0.731l-80.673,96.527   c-1.342,1.681-1.433,2.056,0.366,2.073l161.59-0.427c2.221-0.182,2.23-0.07,0.792-1.951l-79.27-96.527   C380.986,375.84,380.501,375.654,379.93,375.668L379.93,375.668z M395.419,384.266l72.746,88.478   c0.974,1.182,1.212,1.249,2.927,0.427l38.354-17.562c2.513-1.134,2.165-1.366,0.487-2.5L395.419,384.266z M361.454,387.498   c-0.034-0.072-0.625,0.37-1.952,1.281L253.89,458.292l33.05,15.001c1.724,0.568,2.239,0.599,3.354-0.793l69.698-83.234   C360.973,388.129,361.487,387.57,361.454,387.498L361.454,387.498z M515.056,459.756c-0.328,0.023-0.846,0.212-1.646,0.548   l-39.392,17.989c-1.398,0.635-1.311,1.49-0.792,2.561l45.793,116.162l-3.292-135.309   C515.626,460.228,515.604,459.717,515.056,459.756L515.056,459.756z M250.902,463.354l-4.208,131.651l38.782-113.907   c0.573-1.682,0.559-1.767-0.61-2.317L250.902,463.354L250.902,463.354z M461.761,480.427l-165.249,0.427   c-2.361-0.035-2.264-0.033-1.098,1.89l83.905,141.529c1.417,2.159,1.265,2.092,2.744-0.121l80.612-141.772   C463.383,481.253,463.887,480.466,461.761,480.427L461.761,480.427z M468.347,484.147c-0.152,0.064-0.318,0.639-0.793,1.524   l-81.16,142.809c-0.887,1.508-1.097,2.048,1.036,1.708l128.845-17.744c2.044-0.467,1.982-1.197,1.281-3.232l-48.6-123.479   C468.635,484.55,468.5,484.083,468.347,484.147L468.347,484.147z M290.171,485.489c-0.158,0.113-0.3,0.715-0.609,1.585   l-41.16,121.162c-0.701,2.573-0.78,3.541,1.829,4.024l123.113,17.805c2.328,0.351,2.03-0.822,1.463-1.951l-83.783-141.345   C290.498,485.702,290.329,485.375,290.171,485.489L290.171,485.489z M258.158,619.334l120.796,68.538   c1.564,0.949,1.929,0.604,1.707-1.036l-2.561-48.05c-0.07-1.551-0.28-2.183-1.89-2.439L258.158,619.334L258.158,619.334z    M507.922,619.455l-122.625,16.952c-1.618,0.238-1.326,1.032-1.342,2.195l2.622,48.903c0.135,1.483,0.091,2.017,1.89,1.098   L507.922,619.455z"/></g></svg>'

    return usicon;

}

//Update the list of dates based on the selected user
function populatedates(user) {

    let alldates = Object.keys(game.users.contents.find(f => f.name === user)['flags']['simple-dice-stats']['d20stats']);

    let messagealldatesfrom = '';
    let messagealldatesto = '';

    for (var i = 0; i < alldates.length; i++) {

        messagealldatesfrom = messagealldatesfrom + '<option value=' + alldates[i] + '>' + alldates[i] + '</option>';
        messagealldatesto = messagealldatesto + '<option value=' + alldates[i] + '>' + alldates[i] + '</option>';

    }
    return {
        messagealldatesfrom,
        messagealldatesto
    }
}

// Update the shown info when something is selected
function updatechartonchange() {

    let fromd = $('select[name="datefrom"] option:selected').text();
    let tod = $('select[name="dateto"] option:selected').text();

    let start = new Date(fromd.split('/').reverse().join('-'));
    let end = new Date(tod.split('/').reverse().join('-'));

    if (start > end) {
        ui.notifications.error("Wrong date selection");
    }
    else {

        wus();

        let theuser = $("#selectuser").val();

        let uscolor = game.users.contents.find(f => f.name === theuser).color;

        let svigcon = d20icon(uscolor);

        let p = updatedata(fromd, tod, theuser);

        let usermostd20 = MoreInRange(fromd, tod, 20);
        let usermostd1 = MoreInRange(fromd, tod, 1);

        $('.divsvgdice').html(svigcon);
        $('#allthebars').html(p['appcontent']);
        $('.chartitle').html(p['chartitle']);
        $('.chartitle').css('color', uscolor);
        $('.bar').css('background-color', uscolor);

        //Update table
        $('#nat1s').html(p['nat1s']);
        $('#nat20s').html(p['nat20s']);
        $('#att20s').html(p['att20s']);
        $('#att1s').html(p['att1s']);
        $('#totalrolls').html(p['totalrolls']);
        $('#usermostd1').html(usermostd1);
        $('#usermostd20').html(usermostd20);


    }
}

function MoreInRange(startDate, endDate, index) {
    // Convert dates to Date objects for comparison
    let usnames = game.users.contents.map(obj => obj.name);
    let users = {};
    for (let user of usnames) {
        users[user] = game.users.contents.find(f => f.name === user)['flags']['simple-dice-stats']['d20stats'];
    }

    let start = new Date(startDate.split('/').reverse().join('-'));
    let end = new Date(endDate.split('/').reverse().join('-'));

    let maxRolls = 0;
    //let maxUser = null;
    let maxUsers = [];

    for (let user in users) {
        let data = users[user];
        let total = 0;

        for (let date in data) {
            let currentDate = new Date(date.split('/').reverse().join('-'));

            // Check if the current date is within the range
            if (currentDate >= start && currentDate <= end) {
                if (data[date].diceRolls && data[date].diceRolls[index - 1]) {
                    total += data[date].diceRolls[index - 1];
                }
            }
        }

        if (total > maxRolls) {
            maxRolls = total;
            maxUsers = [user];
            //maxUser = user;
        } else if (total === maxRolls && maxRolls !== 0) {
            maxUsers.push(user);  // Add to the list of max users
        }
    }

    if (maxUsers.length === 0) {

        maxUsers = ['No one'];

    }

    return maxUsers.join(', ');
}

// Function to get the data from the selected range
function sumInRange(data, startDate, endDate) {
    // Convert dates to Date objects for comparison
    let start = new Date(startDate.split('/').reverse().join('-'));
    let end = new Date(endDate.split('/').reverse().join('-'));

    let result = { a: 0, b: new Array(20).fill(0), c: 0, d: 0 };

    for (let date in data) {
        let currentDate = new Date(date.split('/').reverse().join('-'));

        // Check if the current date is within the range
        if (currentDate >= start && currentDate <= end) {
            result.a += data[date].totalRolls;
            for (let i = 0; i < data[date].diceRolls.length; i++) {
                result.b[i] += data[date].diceRolls[i];
            }
            // Check if "attacks20" and "attacks1" exist for the date
            if (data[date].hasOwnProperty('attacks20')) {
                result.c += data[date].attacks20;
            }
            if (data[date].hasOwnProperty('attacks1')) {
                result.d += data[date].attacks1;
            }
        }
    }

    return result;
}