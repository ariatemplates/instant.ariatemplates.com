## Hello World

**InstantTemplate.tpl**

    {macro main()}
        <h1>Hello World!</h1>
    {/macro}

## Template Logic

**InstantTemplate.tpl**

    {macro main()}
        <div class="mainlist">
            {foreach person inArray data.people}
                {if person.name == "Bart"}
                    {call helloDiv(person, "bart")/}
                {else /}
                    {call helloDiv(person, "person")/}
                {/if}
            {/foreach}
            <span class="footnote">(${data.people.length} people in the list)</span>
        </div>
    {/macro}

    {macro helloDiv(person, cssClass)}
        <div class="${cssClass}">Hello ${person.name}</div>
    {/macro}

**InstantTemplateStyle.tpl.css**

    {macro main()}
        .bart {
            color: blue;
            font-size: 1.4em;
        }
        .footnote {
            font-style: italic;
            font-size: 0.8em;
            color: grey;
        }
    {/macro}

**Data Model**

    {
      "people": [
        {"name": "Omer", "age": 38 },
        { "name": "Marge", "age": 38 },
        { "name": "Bart", "age": 10 },
        { "name": "Lisa", "age": 8 },
        { "name": "Maggie", "age": 1 }
      ]
    }

## Forms

**InstantTemplate.tpl**
**InstantTemplateScript.js**
**InstantTemplateStyle.tpl.css**
**Data Model**

    {
      "people": [
        {"name": "Omer", "age": 38 },
        { "name": "Marge", "age": 38 },
        { "name": "Bart", "age": 10 },
        { "name": "Lisa", "age": 8 },
        { "name": "Maggie", "age": 1 }
      ]
    }

## Dynamic Updates

**InstantTemplate.tpl**
**InstantTemplateScript.js**
**InstantTemplateStyle.tpl.css**
**Data Model**

    {
      "people": [
        {"name": "Omer", "age": 38 },
        { "name": "Marge", "age": 38 },
        { "name": "Bart", "age": 10 },
        { "name": "Lisa", "age": 8 },
        { "name": "Maggie", "age": 1 }
      ]
    }

## Seconds Elpased

**InstantTemplate.tpl**
**InstantTemplateScript.js**
**InstantTemplateStyle.tpl.css**
**Data Model**

## Todo List

**InstantTemplate.tpl**
**InstantTemplateScript.js**
**InstantTemplateStyle.tpl.css**
**Data Model**




console.log("test", this.data.secondsElapsed);