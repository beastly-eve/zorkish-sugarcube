# Text Adventure Command Input macro for SugarCube 2 and Twine

![screen-grab](screen-grab.gif)

This is a functional **work in progress** macro/system to use Twine 2 and SugarCube2 to make text adventure-style games (Zork etc) where the player types in the action they want to perform. 

The macro has these built in actions: GO, LOOK, TAKE, REMEMBER, USE, DROP, and FORGET, but you can define custom actions within the passage. The TAKE and REMEMBER actions use The Simple Inventory System by ChapelR for their functionality, so if you want to use them, you should have this macro enabled as well: https://github.com/ChapelR/custom-macros-for-sugarcube-2/blob/master/docs/simple-inventory.md . You can paste the code from it after the Zorkish Sugarcube code in your story JS.

The code for the command input box itself is adapted from the SugarCube textbox macro.

## Usage

### Macro tags and elements

#### Command Input box

Each passage that you want the command input box to appear in needs to have this macro tag:

` <<commandbox $command>>`

This macro only takes one argument, which is the variable name that's passed through the code to validate and carry out the player's command. For now, only use the variable shown in the example.

#### Passage Actions Macro tag

For the command box to do anything, you need to define what is actionable in your passage. You do this by setting variables into specifically formatted javascript objects and then passing the variables as arguments through the macro tag:

`<<passageactions $actionablesubject1 $actionablesubject2>>`

This tag can take as many variables as actionable subjects you define. An actionable subject (or "subject") is a "thing" you define that can have actions performed on it. This tag is required for each passage that uses this system. An empty variable will be ignored. How to set the subject's options is in the Defining Subjects and Actions section below. 

#### Message Box Element

The message box is a div that must be included if you want your actions to have any feedback text/messages. So, if the player "Looks" at a subject, the text will appear in this box. By default the code is this:

`<div id="message-box" style="height: 35px"></div>`

Technically this is optional, but I can't imagine many use cases where you'd leave it out.

### Default Actions

#### Go (Read this example first)

```javascript
<<set $blueroom = {
    name: "The Blue Room",
    keywords: ['the blue room', 'blue room', 'room', 'through door', 'north'],
    possibleActions: {
        go: "blue room",
    }
}>>

<<passageactions $blueroom>>
```

We start by setting the `name`, this is the overall name of the subject that the player can perform actions on. It's used by the system and is the name that will be added to in inventories. In this case, the subject is a room/passage, so it shouldn't be added to inventories, unless you're doing something really experimental.

Next is `keywords` which defines every word that player might refer to your subject as. The system will search through the player's command for one of these phrases to determine if they want to do something to this subject. It will not look at the `name` . If you want the player to be able to use `Go north` or `Go up` for navigating passages, include north/up in your keywords.

`possibleActions` is where you define the actions the player can take on the actionable subject. In this case, the subject is a room/passage and has the `go` action defined.

`possibleActions > go` is triggered by the word "go" in the player's input. It takes one value, the passage name that it leads to.

#### Look

```javascript
<<set $book = {
    name: 'book',
    keywords: ['book', 'paperback'],
    possibleActions: {
      look: "The book looks heavy, dusty, and old.",
    }
} >>
  
<<passageactions $book>>
```

The `look` action takes only one value which is the text to display when activated on the subject. The words `examine`, `see`, and `check` will also activate this action.

#### Take

```javascript
<<set $dagger = {
    name: 'dagger',
    keywords: ['dagger', 'blade', 'knife'],
    possibleActions: {
      take: {
        enabled: true,
        description: 'You take the dagger. You might need to stab someone, later.',
        disabledDescription: 'The dagger melts into a puddle before your eyes.',
        inventory: "inventory",
        refresh: true
      }
    }
} >>

<<passageactions $dagger>>
```

For `take` the first option is `enabled` which determines if you can take the subject in the first place. If it's `true` then the `description` text will show after taking. If it's `false` then the `disabledDescription` text will show after attempting to take it.  `inventory` defines the name of the Simple Inventory to use. `refresh` determines if the passage will be refreshed after the subject is taken, by default it's false. If this is enabled then the `description` won't show.

Currently you should only use one inventory for this named `inventory`. Eventually you will be able to have multiple inventories named whatever you want, but for now this is what works.

#### Remember

```javascript
<<set $photo = {
  name: "a photo of a man",
  keywords: ['photo', 'picture', 'image'],
  possibleActions: {
    remember: {
      description: "You inspect the photograph. You will never forget those creepy eyes.",
      inventory: "memorybank",
      runfunction: function(){alert("I'll never forget.")}
    }
  }
} >>

<<passageactions $photo>>
```

For the `remember` action there are two options, `description` which is the text that will display after performing the action and `run function` where you can define a javascript function to run when actioning the subject. `inventory` defines the name of the Simple Inventory to use, this should be different than the `take` inventory. `refresh` determines if the passage will be refreshed after the subject is remembered, by default it's false. If this is enabled then the `description` won't show.

Currently you should only use one inventory for this named `memorybank`. Eventually you will be able to have multiple inventories named whatever you want, but for now this is what works.

#### Use

```javascript
<<set $voodoodoll = {
    name: "a voodoo doll",
    keywords: ['voodoo doll', 'doll'],
    possibleActions: {
      use: {
        dagger: {
          name: "dagger",
          description: "You poke the doll with the dagger. Ouch! It hurts you.",
        },
        book: {
          name: 'book',
          description: "You look up about the doll in the book which tells you it's name is Gary.",
          runfunction: function(){alert("Gary. That's your name!")}
        }
      }
    }
} >>
  
<<passageactions $voodoodoll>>
```

The `use` action allows you to have a valid command with two subjects. For a subject, you define other subjects available that can be used ON it. So if you can use a `dagger` on a `voodoo doll`, then you define the action associated with the `dagger` in the`voodoo doll` options (as shown above). The `dagger` must also be defined as an subject in the passage or it will not validate, and the names must match exactly. You can define multiple use actions. If more than two subjects are detected it will reject the command. The `use` account can trigger a `description` and run a function.

#### Drop & Forget

The `DROP` and `FORGET` actions are automatically enabled for every inventory item you can `TAKE` and `REMEMBER` respectively.

#### Help

The `HELP` command will list all subjects you can act on and all actions you can perform. This is turned on by default but can be turned off in the Config section in code by setting the const `HELPCOMMANDENABLED` to `false`

### Custom actions

``` javascript
<<set $pie = {
    name: "a cherry pie",
    keywords: ['cherry pie', 'pie', 'tasty pie'],
    possibleActions: {
      customactions: {
        smell: {
          actionkeywords: ["sniff", "smell", "snort"],
          description: "It smells fruity and tasty.",
        },
        eat: {
          actionkeywords: ["eat", "munch", "bite"],
          description: "It's too hot to eat and it scalds your mouth.",
          runfunction: function(){alert("You just lost 2 hit points.")}
        }	
      }
	} >>

<<passageactions $pie>>
```

For `custom actions` you define your own arbitrary object keys in your subject options based on the name of the action. You can have as many custom actions defined as you like. In the `actionkeywords` option, you define the different words the player could use to perform your custom action. `description` sets the text that will display after the player performs the action and `runfunction`  let's you run a function after the player performs the action. 

### Running Functions for Actions  from Story JS

```javascript
/* In your story JS */

setup.yourFunction = function(){
    console.log('This function can be run from from a passage');
}

/* In your passage */
<<set $photo = {
  name: "a photo of a man",
  keywords: ['photo', 'picture', 'image'],
  possibleActions: {
    remember: {
      description: "You inspect the photograph. You will never forget those creepy eyes.",
      inventory: "memorybank",
      runfunction: setup.yourFunction // Here it is!
    }
  }
} >>
  
<<passageactions $photo>>
```

If you want to run a function from your story JS for one of your defined actions, you have to set it up in a special way. Add your function to the `setup` variable and then call it in the action options.

### Full Passage Code Example

Below is an example of what a passage might look like with this code.

```javascript
You are in a red room. On the table is a cherry pie, a dagger, a book, a voodoo doll, and a photo of a man. There is a blue door that leads to the blue room.

<div id="message-box" style="height: 35px"></div>
<<commandbox "$command">>

<<set $pie = {
    name: "a cherry pie",
    keywords: ['cherry pie', 'pie', 'tasty pie'],
    possibleActions: {
      customactions: {
        smell: {
          actionkeywords: ["sniff", "smell", "snort"],
          description: "It smells fruity and tasty.",
        },
        eat: {
          actionkeywords: ["eat", "munch", "bite"],
          description: "It's too hot to eat and it scalds your mouth.",
          runfunction: function(){alert("You just lost 2 hit points.")}
        }	
      }
} >>
	
<<set $photo = {
  name: "a photo of a man",
    keywords: ['photo', 'picture', 'image'],
    possibleActions: {
      remember: {
        description: "You inspect the photograph. You will never forget those creepy eyes.",
        inventory: "memorybank",
        runfunction: function(){alert("I'll never forget.")}
      }
    }
} >>

<<set $dagger = {
    name: 'dagger',
    keywords: ['dagger','blade', 'knife'],
    possibleActions: {
      take: {
        enabled: true,
        description: 'You take the dagger. You might need to stab someone, later.',
        disabledDescription: 'The dagger melts into a puddle before your eyes.',
        inventory: "inventory"
      }
    }
} >>

<<set $book = {
    name: 'book',
    keywords: ['book', 'paperback'],
    possibleActions: {
      look: "The book looks heavy, dusty, and old.",
    }
} >>

<<set $blueroom = {
    name: "The Blue Room",
    keywords: ['the blue room', 'blue room', 'room', 'through door'],
    possibleActions: {
        go: "blue room",
    }
}>>
  
<<set $voodoodoll = {
    name: "a voodoo doll",
    keywords: ['voodoo doll', 'doll'],
    possibleActions: {
      use: {
        dagger: {
          name: "dagger",
          description: "You poke the doll with the dagger. Ouch! It hurts you.",
        },
        book: {
          name: 'book',
          description: "You look up about the doll in the book which tells you it's name is Gary.",
          runfunction: function(){alert("Gary. That's your name!")}
        }
      }
    }
} >>

<<passageactions $pie $photo $book $dagger $blueroom $voodoodoll>>
```

In order for the inventory functions to work, you will need to put this code in your games first screen or setup code.

```javascript
<<newinventory '$inventory'>>\
<<newinventory '$memorybank'>>\
```

### Organizing Your Code

Looking at the above example, it may feel a little messy. It make it a little easier to deal with, I recommend separating your subject definitions into a separate passage that you include. This way it won't get in the way of your writing. That would cause the main passage to look something like this, with the include statement having your passage names.

```
You are in a red room. On the table is a cherry pie, a dagger, a book, a voodoo doll, and a photo of a man. There is a blue door that leads to the blue room.

<<include yourPassageWithCommandPrompt>>
<<include yourPassageWithPassageActions>>

```

### Persistent Actionable Subjects/Inventory Actionable Subjects

If you want to add persistent actionable subjects that can work on any passage, create a PassageFooter and place them in there with a separate `<<passageactions $var >>` macro tag.

This includes actions on inventory items, so if you have an inventory item that you want actionable (including being able to DROP it or FORGET it) you have to define it in the PassageFooter. Include a separate `passageactions` inside an `if` statement for each inventory item that's in the inventory.

In general, you should make one of these for every inventory item or your game may behave a little strangely.

```javascript
<<if $inventory.has('a cherry pie')>>
<<set $pie = {
    name: "a cherry pie",
    keywords: ['cherry pie', 'pie', 'tasty pie'],
    possibleActions: {
            look: "The pie is a bit squished from being in your pocket.",
      customactions: {
        smell: {
          actionkeywords: ["sniff", "smell", "snort"],
          description: "It smells fruity and tasty.",
        },
        eat: {
          actionkeywords: ["eat", "munch", "bite"],
          description: "It's too hot to eat.",
        }
      }
    }
	} >>\
  <<passageactions $pie>>\
<</if>>\
```

~~This action will overwrite any actions already associated with `$pie` in the current passage, so it's best to use the same variable.~~ **For some reason it's not overwriting any more for me. So for now, you may also have to put an IF statement around where you define the subject in the room as well**

If, alternatively, you DON'T want a subject in your inventory to be actionable, set `pie` to a subject with possibleActions empty.

### Debugging/Error messages

For debugging your subject options/defined actions you can set the const `ERRORMESSAGES` to `true`. You can find it in the Config section of the code. It will display error messages in the message box. By default this is set to `false`



