/* Text Adventure Command Input macro for SugarCube 2 */

/* TODO: 

1. Add ability to include extra keywords
2. Split up go passage and thing commands?
3. Adjust function and variable cases and names to match
4. CONST variables for inventories with "take" and "remember"
5. Add persistent actionable items, including inventory?
6. Add in inventory actions
7. Put custom fuctions into an object?
8. Make code better, break up into more functions
9. Tweego, git and github?
10. Validate passage code? If there are multiple keywords in conflict or missing default arguments!
11. Get command-box html tag from varName?
12. Allow user to set inventory that take and remember will use


*/

/* Setting up the actional subjects object and default values */

// CONFIG
const ACTIONS = ["GO", "LOOK", "REMEMBER", "TAKE"];
const DEFAULTSUBJECTS = ["NORTH", "SOUTH", "EAST", "WEST", "UP", "DOWN", "FOWARD", "BACKWARD"];
const MESSAGEBOX = "#message-box";
const COMMANDBOX = "#commandbox-command";
const INVENTORY = "inventory";
const MEMORYBANK = "memorybank";

var actionableSubjects = {};
var persistentActionableSubjects = {}; // NOTE: change these variable names to have passage / global? (this isn't in use yet)

/* Clear out actionable subjects before each passage */
$(document).on(':passagestart', function (ev) {
	actionableSubjects = {};
});

/* Error command shake function */
jQuery.fn.shake = function() {
    this.each(function(i) {
        $(this).css({ "position" : "relative" });
        for (var x = 1; x <= 3; x++) {
            $(this).animate({ left: -15 }, 10).animate({ left: 0 }, 50).animate({ left: 15 }, 10).animate({ left: 0 }, 50);
        }
    });
    return this;
}

/* Normalize */
function normalize(input){
    return input.toLowerCase().replace(/\s+/g, '');
}

/*  Actionable Subject Object example */
const actionableSubjectDefaults = {
        name: "it", // String: The name used in text and for inventory
        keywords: [], // Array : The object's nicknames to identify it in a command
        isPassage: false, // Boolean : This is to validate the "GO" action
        possibleActions: {
            go: false, // String : Passage name, doesn't work unless isPassage is true
            look: "Nothing special about it.", // String : Description of what you see
            take: {
                    enabled: false, // Boolean : Whether you can take or not
                    description: "You take it.", // String : Custom description of taking if enabled is true (optional)
                    disabledDescription: "You can't take it.", // String : Custom description if enabled is false, default is false
                    inventory: "inventory" // String : name of the inventory to store it
                },
            remember: {
                    description: "You'll never forget it.", // String: Message to display when remembering
                    inventory: "memorybank", // String : name of the inventory to store it
                    runfunction: false, // Function: function to run
                },
            customactions: { // You can have as many as you want
                customaction1: {
                        actionkeywords: [], // Array: the actions identifying keywords. Example: ["sniff", "smell", "snort"]
                        description: "You do the thing", // String: message to display when triggering action
                        runfunction: false // Function: to run
                }
            }
        }
}

/* Parsing functions */
function getAction(commandpromptinput){
    // Make command lowercase and remove everything after first word
    let commandAction = commandpromptinput.toLowerCase().replace(/ .*/,'');

    if(commandAction === "go" || commandAction === "take" || commandAction === "remember"){
        return commandAction;

    } else if(commandAction === "look" || commandAction === "examine" || commandAction === "check") {
        return "look";

    } else {
        return commandAction;
    }


}

function getSubject(command, actionableSubjects){
    // Cycle through the passages subjects
    for (let key in actionableSubjects) {
        // Cycle through the different names/keywords for each subject
        for(let i = 0; i < actionableSubjects[key]['keywords'].length; i++){
            // Test if user command contains any of the subject's names/keywords 
            if(command.includes(actionableSubjects[key]['keywords'][i])){
                
                return actionableSubjects[key];
            }
        }
    }

}

function getCustomAction(action, subject, actionableSubjects){
    // Cycle through the subjects in the passage to see if they match the subject of the command
    for (let key in actionableSubjects) {
        if(actionableSubjects[key]['name'] === subject['name']){

            // Test to see if the matching subject has any custom actions
            if(actionableSubjects[key]['possibleActions']['customactions']){

                // Cycle through each custom action found
                for(let customkey in actionableSubjects[key]['possibleActions']['customactions']){
                    // Test if any of the action keywords match the user's action
                    if(actionableSubjects[key]['possibleActions']['customactions'][customkey]['actionkeywords'].includes(action)){
                       
                        // Return an array with the custom action description and custom action function
                        let customactiondescription = actionableSubjects[key]['possibleActions']['customactions'][customkey]['description'];
                        let customactionfunction = actionableSubjects[key]['possibleActions']['customactions'][customkey]['runfunction'];

                        let customaction = [customactiondescription, customactionfunction];

                        return customaction;
                    } 
                }               
            }
        }

    }

    return false;
}

function isValidCommand(action, subject, actionableSubjects){
    // Test if the subject exists and if the action associated is defined
    if(subject){
        if(subject['possibleActions'][action]) {
            return true;
        } else if(getCustomAction(action, subject, actionableSubjects)){
            return true;
        } else {
            return false;
        }
    }
    return false;
}

function performAction(command){
    var action = getAction(command);
    var subject = getSubject(command, actionableSubjects);

    if(isValidCommand(action, subject, actionableSubjects)){

        switch(action){
            case 'go': 
                // Goes to defined passage
                Engine.play(subject['possibleActions']['go']);
                break;

            case 'look': 
                // Prints description text
                $(MESSAGEBOX).html(subject['possibleActions']['look']);
                break;

            case 'take':
                if(subject['possibleActions']['take']['enabled']){
                    // Prints description text
                    $(MESSAGEBOX).html(subject['possibleActions']['take']['description']);

                    // Checks for inventory definition and adds it to inventory
                    if(subject['possibleActions']['take']['inventory']) {
                        let objectinventory = subject['possibleActions']['take']['inventory'];
                        State["variables"][objectinventory]["pickUp"](subject['name']);
                    }

                    // Adds item to persistent objects
                    let subjectslug = normalize(subject['name']);
                    persistentActionableSubjects[subjectslug] = subject;

                    // Reloads passage
                    Engine.play(passage());
    
                } else {
                    // Prints disabled description text
                    $(MESSAGEBOX).html(subject['possibleActions']['take']['disabledDescription']);
                    
                }
                break;

            case 'remember':
                // Prints description text
                $(MESSAGEBOX).html(subject['possibleActions']['remember']['description']);

                // If there's a function defined, run it
                if(subject['possibleActions']['remember']['runfunction']){
                    subject['possibleActions']['remember']['runfunction']();
                }

                // Checks to see if inventory is defined and adds it to inventory 
                if(subject['possibleActions']['take']['inventory']) {
                    let memoryinventory = subject['possibleActions']['remember']['inventory'];
                    State["variables"][memoryinventory]["pickUp"](subject['name']);
                }
                break;
            
            default: 
                let customaction = getCustomAction(action, subject, actionableSubjects);

                // Prints description text
                $(MESSAGEBOX).html(customaction[0]);

                // If there's a function defined, run it
                if(customaction[1]){
                    customaction[1]();
                }
        }

    } else {
    
        // If a valid command is not found, shake the commandbox as an error
        $(COMMANDBOX).shake();
    }

    $(COMMANDBOX).val("");

}


/*
----------------------------
Add actions to passage macro
----------------------------

*/

Macro.add('passageactions', {

    isAsync : true,
    handler() {

        let actions = this.args;

        for(let i = 0; i < actions.length; i++){
            if(typeof actions[i] === 'object' && actions[i] !== null){
                console.log('Object found.')
                actionableSubjects[i] = actions[i];
            } else {
                var argtype = typeof actions[i];
                console.log("This is not an object, it's a " + argtype);
                console.log(actions[i]);
                console.log('--------------');
            }

        }

    }
});


/* 
------------------------
Macro to add command box - adapted from sugarcube textbox macro
------------------------
 */
Macro.add('commandbox', {

    isAsync : true,

    handler() {
        if (this.args.length > 1) {
            const errors = [];
            return this.error('Only one argument allowed to set variable name');
        }

        // Ensure that the variable name argument is a string.
        if (typeof this.args[0] !== 'string') {
            return this.error('variable name argument is not a string');
        }

        const varName = this.args[0].trim();

        // Try to ensure that we receive the variable's name (incl. sigil), not its value.
        if (varName[0] !== '$' && varName[0] !== '_') {
            return this.error(`variable name "${this.args[0]}" is missing its sigil ($ or _)`);
        }

        // Custom debug view setup.
        if (Config.debug) {
            this.debugView.modes({ block : true });
        }

        const varId = Util.slugify(varName);
        const el    = document.createElement('input');

        // Set up and append the input element to the output buffer.
        jQuery(el)
            .attr({
                id       : `${this.name}-${varId}`,
                name     : `${this.name}-${varId}`,
                type     : 'text',
                tabindex : 0 // for accessiblity
            })
            .addClass(`macro-${this.name}`)
            .on('change.macros', this.createShadowWrapper(function () {
                State.setVar(varName, this.value);
            }))
            .on('keypress.macros', this.createShadowWrapper(function (ev) {
                // If Return/Enter is pressed, set the variable and, optionally, forward to another actionObject.
                if (ev.which === 13) { // 13 is Return/Enter
                    ev.preventDefault();
                    State.setVar(varName, this.value);
                    performAction(this.value);
                    /*
                    if (actionObject != null) { // lazy equality for null
                        
                            Engine.play(passage());
                    }
                    */
                }
            }))
            .appendTo(this.output);

            // Set the element's "autofocus" attribute.
            el.setAttribute('autofocus', 'autofocus');

            // Set up a single-use post-display task to autofocus the element.
            postdisplay[`#autofocus:${el.id}`] = task => {
                delete postdisplay[task]; // single-use task
                setTimeout(() => el.focus(), 200);
            };

        // Set the variable and input element to the default value.
        State.setVar(varName, "");
    }
});

// Include Simple Inventory System here: https://github.com/ChapelR/custom-macros-for-sugarcube-2/blob/master/docs/simple-inventory.md#macro-sort