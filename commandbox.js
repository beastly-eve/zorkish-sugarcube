/*

 ________  ________  ________  ___  __    ___  ________  ___  ___                             
|\_____  \|\   __  \|\   __  \|\  \|\  \ |\  \|\   ____\|\  \|\  \                            
 \|___/  /\ \  \|\  \ \  \|\  \ \  \/  /|\ \  \ \  \___|\ \  \\\  \                           
     /  / /\ \  \\\  \ \   _  _\ \   ___  \ \  \ \_____  \ \   __  \                          
    /  /_/__\ \  \\\  \ \  \\  \\ \  \\ \  \ \  \|____|\  \ \  \ \  \                         
   |\________\ \_______\ \__\\ _\\ \__\\ \__\ \__\____\_\  \ \__\ \__\                        
    \|_______|\|_______|\|__|\|__|\|__| \|__|\|__|\_________\|__|\|__|                        
                                                 \|_________|                                 
                                                                                              
                                                                                              
 ________  ___  ___  ________  ________  ________  ________  ___  ___  ________  _______      
|\   ____\|\  \|\  \|\   ____\|\   __  \|\   __  \|\   ____\|\  \|\  \|\   __  \|\  ___ \     
\ \  \___|\ \  \\\  \ \  \___|\ \  \|\  \ \  \|\  \ \  \___|\ \  \\\  \ \  \|\ /\ \   __/|    
 \ \_____  \ \  \\\  \ \  \  __\ \   __  \ \   _  _\ \  \    \ \  \\\  \ \   __  \ \  \_|/__  
  \|____|\  \ \  \\\  \ \  \|\  \ \  \ \  \ \  \\  \\ \  \____\ \  \\\  \ \  \|\  \ \  \_|\ \ 
    ____\_\  \ \_______\ \_______\ \__\ \__\ \__\\ _\\ \_______\ \_______\ \_______\ \_______\
   |\_________\|_______|\|_______|\|__|\|__|\|__|\|__|\|_______|\|_______|\|_______|\|_______|
   \|_________|                                                                               
                                                                                              
                                                                                            

Text Adventure Command Input macro for SugarCube 2 

This is a work in progress macro/system to use Twine 2 to make text adventure-style games (Zork etc) where the user types in the action they want to make. 

The macro has the built in defaults actions of: GO, LOOK, TAKE, REMEMBER, USE, DROP, and FORGET, but the user can define custom actions within the passage. The TAKE and REMEMBER actions use The Simple Inventory System by ChapelR for their functionality, so if you want to use them, you should have this macro enabled as well: https://github.com/ChapelR/custom-macros-for-sugarcube-2/blob/master/docs/simple-inventory.md

The code for the command input box itself is adapted from the SugarCube textbox macro

/* TODO: 

1. USE action ("Use key on door")

3. Adjust function and variable cases and names to match

7. Put custom fuctions into an object?
8. Make code better, break up into more functions
9. Tweego, git and github?
10. Error handling and Validate passage code: If there are multiple keywords in conflict or missing default arguments! Error for inventory not existing? Make an exists inventory test function?, objects have "use" statements for each other?
11. Get command-box html tag from varName?
12. Change actionableSubjects from object to array?

15. Config option to reload passages on inventory updating?

17. Set additonal keywords for default actions in config?
18. Make subjects not case sensitive
19. getCustomAction return sub-object from subject instead of array
20. Clear up terminology subject vs object (object should probably stay a JS term)
21. Order USE subjects based on command?
22. Validate for user: "You didn't begin with an action"

23. Look at pie doesn't work while in pocket anymore -> drop, remember either

24. Add "Go Back?"
25. Add more comments to code
26. Add option for runfunction on every action?
27. Config option to refresh passage for inventory and remember

*/

/* Setting up the actional subjects object and default values */

/* 
---------------------------------------------
Config (these don't really do much right now)
----------------------------------------------
*/


const MESSAGEBOX = "#message-box";
const COMMANDBOX = "#commandbox-command";
const TAKEINVENTORY = "inventory";
const MEMORYBANK = "memorybank";

/* 
-------------------------------
Setup and Utility Functions
-------------------------------
*/

/* This object will fill with the detected subjects you can perform actions in each passage */
var actionableSubjects = {};

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

/* Find object length */
function ObjectLength( object ) {
    var length = 0;
    for( var key in object ) {
        if( object.hasOwnProperty(key) ) {
            ++length;
        }
    }
    return length;
};

/*  Actionable Subject Object example */
const actionableSubjectDefaults = {
        name: "it", // String: The name used in text and for inventory
        keywords: [], // Array : The object's nicknames to identify it in a command
        possibleActions: {
            go: false, // String : Passage name
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
            use: {
                useonitem1: {
                    name: "item to use on it", // String: Name that matches the item that can be used on/with this item
                    description: "You use the item on it.", // String: Text to display
                    runfunction: false, // Function: Function to run
                }
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

/* 
-------------------------------
Functions for Parsing and Performing actions 
-------------------------------
*/

// Seperates the action from the beginning of the sentence and returns a normalized version
function getAction(commandpromptinput){
    // Make command lowercase and remove everything after first word
    let commandAction = commandpromptinput.toLowerCase().replace(/ .*/,'');

    if(commandAction === "go" || commandAction === "remember" || commandAction === "drop" || commandAction === "forget" || commandAction === "use"){
        return commandAction;

    } else if(commandAction === "take" || commandAction === "pick") {
        return 'take';
    
    } else if(commandAction === "look" || commandAction === "examine" || commandAction === "check" || commandAction === "see") {
        return "look";

    } else {
        return commandAction;
    }


}

// Gets the different subjects in the command
function getSubject(command, actionableSubjects){
    // Set variable to command with action (first word) removed
    let actionlessCommand = command.substr(command.indexOf(" ") + 1).toLowerCase();
    let foundSubjects = [];
    let foundSubjectsNames = [];

    // Cycle through the passages subjects
    for (let key in actionableSubjects) {
        // Cycle through the different names/keywords for each subject
        for(let i = 0; i < actionableSubjects[key]['keywords'].length; i++){
            // Test if user command contains any of the subject's names/keywords and is not already found in the array to be returned
            if(actionlessCommand.includes(actionableSubjects[key]['keywords'][i]) && $.inArray(actionableSubjects[key]['name'], foundSubjectsNames) === -1){
                // Add to array to check if already queued up to be returned
                foundSubjectsNames.push(actionableSubjects[key]['name']);

                //The array that will be returned with the detected subjects
                foundSubjects.push(actionableSubjects[key]);
            }
        }
    }
    return foundSubjects;
}

// Gets the custom action referenced in the command and returns it's properties, also used for command validation
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

// Gets the use action related to the subjects, also used for command validation
function getUseAction(subject, action){
    if(action == 'use'){
        // Check first subject's use definitions to see if any of them match second subject's name
        for(let key in subject[0]['possibleActions']['use']){
            // Return use action properties if match found
            if(subject[0]['possibleActions']['use'][key]['name'] === subject[1]['name']){
                    return subject[0]['possibleActions']['use'][key];
            }
        }

        // Check second subject's use definitions to see if any of them match first subject's name
        for(let key in subject[1]['possibleActions']['use']){
            // Return use action properties if match found
            if(subject[1]['possibleActions']['use'][key]['name'] === subject[0]['name']){

                return subject[1]['possibleActions']['use'][key];
            }
        }

        return false;

    } else {
        return false;
    }
}

function isValidCommand(action, subject, actionableSubjects){
    
    // Check to see if multiple subjects returned (multiple subjects are relevent for 'USE' command or the command will be rejected)
    if(subject.length === 1){
        // Test if the subject exists in possibleActions and if the action associated is defined
        if(subject[0]['possibleActions'][action]) {
            return true;
        
        // If the action isn't defined in possibleActions, check to see if it's a custom action
        } else if(getCustomAction(action, subject, actionableSubjects)){
            return true;
        
        // Drop and Forget are never defined, validate them based on whether subject is in inventory
        } else if(action == "drop" || action == "forget"){
            let subjectInventory = subject[0]['possibleActions']['take']['inventory'];
            let subjectMemoryBank = subject[0]['possibleActions']['remember']['inventory'];

            // Test if subject is in either the memory inventory or subject inventory TODO: Go through every inventory defined by inventory macro so more than two inventories can be used
            if(State["variables"][subjectInventory].has(subject[0]['name']) || State["variables"][subjectMemoryBank].has(subject[0]['name'])){
                return true;

            } else {
                return false;
            }

        } else {
            return false;
        }
    // If there are more than one subject, use the getUseAction function to validate the action USE against the command
    } else if(subject.length === 2 && action === 'use' && getUseAction(subject, action)){
        return true;

    } else {
        return false;
    }
}

function performAction(command){
    var action = getAction(command);
    var subject = getSubject(command, actionableSubjects);

    // Check if the command is valid
    if(isValidCommand(action, subject, actionableSubjects)){

        switch(action){
            case 'go': 
                // Goes to defined passage
                Engine.play(subject[0]['possibleActions']['go']);
                break;

            case 'look': 
                // Prints description text
                $(MESSAGEBOX).html(subject[0]['possibleActions']['look']);
                break;

            case 'take':
                let objectinventory = subject[0]['possibleActions']['take']['inventory'] || TAKEINVENTORY;

                if(subject[0]['possibleActions']['take']['enabled']){
                    if(!State["variables"][objectinventory].has((subject[0]['name']))){
                         // Prints description text
                        $(MESSAGEBOX).html(subject[0]['possibleActions']['take']['description']);

                        // Checks for inventory definition and adds it to inventory
                        State["variables"][objectinventory]["pickUp"](subject[0]['name']);

                        // Reloads passage
                        Engine.play(passage());
                    } else {
                        // If a valid command is not found, shake the commandbox as an error
                        $(COMMANDBOX).shake();
                    }
                   
                } else {
                    // Prints disabled description text
                    $(MESSAGEBOX).html(subject[0]['possibleActions']['take']['disabledDescription']);
                    
                }
                break;

            case 'remember':
                // Prints description text
                $(MESSAGEBOX).html(subject[0]['possibleActions']['remember']['description']);

                // If there's a function defined, run it
                if(subject[0]['possibleActions']['remember']['runfunction']){
                    subject[0]['possibleActions']['remember']['runfunction']();
                }

                // Checks to see if inventory is defined and adds it to inventory, user default if not defined
                let memoryinventory = subject[0]['possibleActions']['remember']['inventory'] || MEMORYBANK;
                State["variables"][memoryinventory]["pickUp"](subject[0]['name']);
                break;

            case 'drop':
                $(MESSAGEBOX).html('You drop it.');

                // Get the inventory the subject is a part of
                let objectinventory4drop = subject[0]['possibleActions']['take']['inventory'] || TAKEINVENTORY;
                // Drop the subject from inventory
                State["variables"][objectinventory4drop]["drop"](subject[0]['name']);

                // Reloads passage
                Engine.play(passage());
                break;
            
            case 'forget':
                $(MESSAGEBOX).html('It\'s forgotten.');

                // Get the inventory the subject is a part of
                let memoryinventory4forget = subject[0]['possibleActions']['remember']['inventory'] || MEMORYBANK;
                // Drop the subject from inventory
                State["variables"][memoryinventory4forget]["drop"](subject[0]['name']);
                break;
            
            case 'use':
                let useAction = getUseAction(subject, action);

                $(MESSAGEBOX).html(useAction['description']);

                if(useAction['runfunction']){
                    useAction['runfunction']();
                } 
                
                break;

            default: 
                let customaction = getCustomAction(action, subject[0], actionableSubjects);

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

setup.testFunction = function(){
    console.log('Test function run');
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
        let definedActionsCount = ObjectLength(actionableSubjects);

        for(let i = 0; i < actions.length; i++){
            if(typeof actions[i] === 'object' && actions[i] !== null){
                actionableSubjects[definedActionsCount] = actions[i];

            } else {
                var argtype = typeof actions[i];
                console.log("This is not an object, it's a " + argtype);
                console.log('--------------');
            }
            definedActionsCount++;
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