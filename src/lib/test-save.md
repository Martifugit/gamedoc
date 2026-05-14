SAVE, doc in: {
"title": "RPGISH 2D GameDoc",
"sections": [
{
"id": "8zb9mn9c",
"title": "Vitality",
"containers": [
{
"id": "cguujm95",
"title": "How Vitality Works",
"level": 1,
"blocks": [
{
"id": "uz3qqyga",
"type": "paragraph",
"text": "A player has three vitality bars instead of the conventional two. [[ref:8zb9mn9c/swxot2t9:Blood]] is health. [[ref:8zb9mn9c/v00murdo:Phlegm]] is the momentum/adrenaline equivalent, built through combat and spent on powerful abilities. [[ref:8zb9mn9c/jgnkiqde:Bile]] is a unique balancing bar ranging from {{var:8tkoq4fg:bile_min}} to {{var:5n9aybx6:bile_max}} that naturally settles at centre. Pushing bile toward corruption (negative) increases damage dealt and taken. Pushing toward purity (positive) increases survivability. "
}
],
"details": null
},
{
"id": "swxot2t9",
"title": "Blood",
"level": 1,
"blocks": [
{
"id": "tp9aozxb",
"type": "paragraph",
"text": "Equivalent to the traditional Health resource. When Blood reaches {{var:l8nm7u92:blood_min}}, you die. "
}
],
"details": null
},
{
"id": "v00murdo",
"title": "Phlegm",
"level": 1,
"blocks": [
{
"id": "qrqxfhtv",
"type": "paragraph",
"text": "Phlegm is a resource used or gained when casting abilities (and performing certain other combat related actions)."
}
],
"details": null
},
{
"id": "jgnkiqde",
"title": "Bile",
"level": 1,
"blocks": [
{
"id": "rf5fblxi",
"type": "paragraph",
"text": "Bile is a unique concept. Rather than being a range from 0 to 100, Bile takes the shape of a three step range from {{var:8tkoq4fg:bile_min}} to {{var:evnen58i:bile_neutral}} to {{var:5n9aybx6:bile_max}}. In general, Bile is a stat modifier that can affect damage and damage taken, however it also works as a threshold for performing certain combat actions (particularly in the [[ref:s1q9idbh:Occultism]] Combat Style). \n"
}
],
"details": null
}
],
"variables": [
{
"id": "5n9aybx6",
"name": "bile_max",
"value": "100"
},
{
"id": "8tkoq4fg",
"name": "bile_min",
"value": "-100"
},
{
"id": "evnen58i",
"name": "bile_neutral",
"value": "0"
},
{
"id": "l8nm7u92",
"name": "blood_min",
"value": "0"
}
],
"description": "Vitality is a skill you can gain experience in that also has a large impact on Combat in the game. "
},
{
"id": "dsm5vy4y",
"title": "Prowess (melee)",
"containers": [
{
"id": "l82wezo6",
"title": "How Prowess Works",
"level": 1,
"blocks": [
{
"id": "yjhtefcp",
"type": "paragraph",
"text": "Prowess is both a skill and a combat style. It is tightly associated with the Religion skill. In addition to traditional combat abilities native to the skill, it massively benefits from Litanies and Verses from Religion.\n\nWhen wielding [[ref:dsm5vy4y:Prowess (melee)]] equipment, you have access to more [[ref:iluxmvzc/bd5j0ree:Litanies & Verses]] than any other combat style has. Litanies can be thought of as stances you lock into for a given duration. Verses are sort of like spells and have a resource cost of materials produced through Rituals in the [[ref:iluxmvzc:Religion]] Skill. Some verses are generally available, while others are tied to a Litany.\n"
}
],
"details": null
}
],
"variables": [],
"description": "Prowess is the Melee combat style. It draws power from [[ref:iluxmvzc:Religion]] (also a separate skill) and scriptures produced through its Rituals."
},
{
"id": "iluxmvzc",
"title": "Religion",
"containers": [
{
"id": "4bs00gvh",
"title": "How Religion Works",
"level": 1,
"blocks": [
{
"id": "eycjod7y",
"type": "paragraph",
"text": ""
}
],
"details": null
},
{
"id": "49ofodve",
"title": "Rituals",
"level": 1,
"blocks": [],
"keyValues": []
},
{
"id": "bd5j0ree",
"title": "Litanies & Verses",
"level": 1,
"blocks": [
{
"id": "3kbzejfu",
"type": "paragraph",
"text": "Litanies can be thought of as stances, and are core to dealing good damage, especially with [[ref:dsm5vy4y:Prowess (melee)]]. Verses are sort of like spells or abilities. Certain Verses are always available ([[ref:iluxmvzc/gb2bads7:Universal Verses]]), others require a specific Litany to be active."
}
],
"details": null
},
{
"id": "gb2bads7",
"title": "Universal Verses",
"level": 2,
"blocks": [
{
"id": "6adaiv62",
"type": "paragraph",
"text": "These Verses are available to all Combat Styles, regardless of active Litany. They share cooldowns and costs but do not benefit from Litany-specific sequencing bonuses (unless otherwise noted)."
}
],
"details": {
"subtitle": "Option Subtitle...",
"pairs": [
{
"id": "d9x7rkxl",
"key": "",
"value": ""
}
]
}
},
{
"id": "recite-first-psalm",
"title": "Recite the First Psalm",
"level": 3,
"blocks": [
{
"id": "psalm-1-desc",
"type": "paragraph",
"text": "Deal minimal damage. Generate 10% additional [[ref:8zb9mn9c/v00murdo:Phlegm]]. No Scripture cost."
}
],
"keyValues": [
{
"subtitle": "Ability Stats",
"pairs": [
{
"id": "p1",
"key": "Phlegm Cost",
"value": "0%"
},
{
"id": "p2",
"key": "Scripture Cost",
"value": "None"
},
{
"id": "p3",
"key": "Seq. Bonus",
"value": "None"
},
{
"id": "p4",
"key": "Cooldown",
"value": "3 seconds"
}
]
}
]
},
{
"id": "verse-reprieve",
"title": "Verse of Reprieve",
"level": 3,
"blocks": [
{
"id": "reprieve-desc",
"type": "paragraph",
"text": "Consume a Page of Rest to heal for 15% of your missing Blood over 6 ticks. Cannot be used while **Stigmata** is active (Wrath only restriction)."
}
],
"keyValues": [
{
"subtitle": "Ability Stats",
"pairs": [
{
"id": "r1",
"key": "Phlegm Cost",
"value": "15%"
},
{
"id": "r2",
"key": "Scripture Cost",
"value": "1x Page of Rest"
},
{
"id": "r3",
"key": "Seq. Bonus",
"value": "If cast while below 25% Blood, heal is doubled but cooldown increases by 50%."
},
{
"id": "r4",
"key": "Cooldown",
"value": "30 seconds"
}
]
}
]
},
{
"id": "canticle-focus",
"title": "Canticle of Focus",
"level": 3,
"blocks": [
{
"id": "focus-desc",
"type": "paragraph",
"text": "For the next 10 ticks, your next Verse costs 25% less Phlegm and has its cooldown reduced by 3 seconds. Does not stack with itself."
}
],
"keyValues": [
{
"subtitle": "Ability Stats",
"pairs": [
{
"id": "c1",
"key": "Phlegm Cost",
"value": "10%"
},
{
"id": "c2",
"key": "Scripture Cost",
"value": "1x Page of Clarity"
},
{
"id": "c3",
"key": "Seq. Bonus",
"value": "No sequencing bonus, but can be cast during any Litany's lock-in without breaking rotation bonuses."
},
{
"id": "c4",
"key": "Cooldown",
"value": "24 seconds"
}
]
}
]
},
{
"id": "doxology-urgency",
"title": "Doxology of Urgency",
"level": 3,
"blocks": [
{
"id": "urgency-desc",
"type": "paragraph",
"text": "Instantly reduce your active Litany's remaining lock-in duration by 6 seconds. Cannot reduce lock-in below 5 seconds."
}
],
"keyValues": [
{
"subtitle": "Ability Stats",
"pairs": [
{
"id": "d1",
"key": "Phlegm Cost",
"value": "0%"
},
{
"id": "d2",
"key": "Scripture Cost",
"value": "1x Page of Haste"
},
{
"id": "d3",
"key": "Seq. Bonus",
"value": "If cast within 5 seconds of switching Litanies, refund 50% of this Verse's Phlegm cost."
},
{
"id": "d4",
"key": "Cooldown",
"value": "45 seconds"
}
]
}
]
},
{
"id": "litany-echo",
"title": "Litany Echo",
"level": 3,
"blocks": [
{
"id": "echo-desc",
"type": "paragraph",
"text": "Repeat the last Verse you cast (from any Litany) at 50% effectiveness. Does not trigger sequencing bonuses or consume additional Scripture pages."
}
],
"keyValues": [
{
"subtitle": "Ability Stats",
"pairs": [
{
"id": "e1",
"key": "Phlegm Cost",
"value": "20%"
},
{
"id": "e2",
"key": "Scripture Cost",
"value": "1x Page of Memory"
},
{
"id": "e3",
"key": "Seq. Bonus",
"value": "If the echoed Verse had a sequencing bonus active when originally cast, the echo deals 75% effectiveness instead of 50%."
},
{
"id": "e4",
"key": "Cooldown",
"value": "36 seconds"
}
]
}
]
},
{
"id": "cy8n4jx9",
"title": "Litany of Mercy",
"level": 2,
"blocks": [
{
"id": "0ph94x33",
"type": "paragraph",
"text": ""
}
],
"keyValues": [
{
"id": "9ogk1lob",
"pairs": [
{
"id": "akfxwv4s",
"key": "Lock-in duration",
"value": "25 sec"
},
{
"id": "vjqm6br1",
"key": "Passive",
"value": "Getting hit periodically triggers Fortitude (take 15% reduced damage for 9 ticks). While below 40% Blood, heals are 20% more effective on self, and your healing abilities are 20% more effective on self and others."
}
]
}
]
},
{
"id": "jw565u3n",
"title": "Litany of Mercy > Verses",
"level": 3,
"blocks": [
{
"id": "cekmtj9g",
"type": "paragraph",
"text": "These Verses are only available while Litany of Mercy is active."
}
],
"keyValues": []
},
{
"id": "nd29i6ml",
"title": "Intercession",
"level": 4,
"blocks": [
{
"id": "gg1faokn",
"type": "list",
"ordered": true,
"items": [
"Something goes here",
"Something goes there"
]
}
],
"keyValues": [
{
"id": "4y7izwzb",
"pairs": [
{
"id": "3lkxrssj",
"key": "Effect",
"value": "Block the next hit against self or an ally (target) within 6 ticks. Heal for 20% (cap: 10% of max Blood) of the hit's value."
},
{
"id": "k1c6q1jh",
"key": "Phlegm Cost",
"value": "15%"
},
{
"id": "kogc821s",
"key": "Scripture Cost",
"value": "1x Page of Protection"
},
{
"id": "226m88k4",
"key": "Seq. Bonus",
"value": " If cast after dealing a critical hit, also reflects 50% damage (cap: 5000)."
},
{
"id": "h5lurudl",
"key": "Cooldown",
"value": "3"
}
]
}
]
}
],
"variables": [],
"description": ""
},
{
"id": "s1q9idbh",
"title": "Occultism",
"containers": [],
"variables": [],
"description": "{{var:8tkoq4fg:bile_min}} "
}
],
"updatedAt": 1778621261438
}

processed meta: [
{
"title": "RPGISH 2D GameDoc",
"updatedAt": 1778712481075
}
]

processed sections: [
{
"id": "8zb9mn9c",
"title": "Vitality",
"description": "Vitality is a skill you can gain experience in that also has a large impact on Combat in the game. "
},
{
"id": "dsm5vy4y",
"title": "Prowess (melee)",
"description": "Prowess is the Melee combat style. It draws power from [[ref:iluxmvzc:Religion]] (also a separate skill) and scriptures produced through its Rituals."
},
{
"id": "iluxmvzc",
"title": "Religion",
"description": ""
},
{
"id": "s1q9idbh",
"title": "Occultism",
"description": "{{var:8tkoq4fg:bile_min}} "
}
]

processed containers: [
{
"id": "cguujm95",
"sectionId": "8zb9mn9c",
"title": "How Vitality Works",
"level": 1
},
{
"id": "swxot2t9",
"sectionId": "8zb9mn9c",
"title": "Blood",
"level": 1
},
{
"id": "v00murdo",
"sectionId": "8zb9mn9c",
"title": "Phlegm",
"level": 1
},
{
"id": "jgnkiqde",
"sectionId": "8zb9mn9c",
"title": "Bile",
"level": 1
},
{
"id": "l82wezo6",
"sectionId": "dsm5vy4y",
"title": "How Prowess Works",
"level": 1
},
{
"id": "4bs00gvh",
"sectionId": "iluxmvzc",
"title": "How Religion Works",
"level": 1
},
{
"id": "49ofodve",
"sectionId": "iluxmvzc",
"title": "Rituals",
"level": 1
},
{
"id": "bd5j0ree",
"sectionId": "iluxmvzc",
"title": "Litanies & Verses",
"level": 1
},
{
"id": "gb2bads7",
"sectionId": "iluxmvzc",
"title": "Universal Verses",
"level": 2
},
{
"id": "recite-first-psalm",
"sectionId": "iluxmvzc",
"title": "Recite the First Psalm",
"level": 3
},
{
"id": "verse-reprieve",
"sectionId": "iluxmvzc",
"title": "Verse of Reprieve",
"level": 3
},
{
"id": "canticle-focus",
"sectionId": "iluxmvzc",
"title": "Canticle of Focus",
"level": 3
},
{
"id": "doxology-urgency",
"sectionId": "iluxmvzc",
"title": "Doxology of Urgency",
"level": 3
},
{
"id": "litany-echo",
"sectionId": "iluxmvzc",
"title": "Litany Echo",
"level": 3
},
{
"id": "cy8n4jx9",
"sectionId": "iluxmvzc",
"title": "Litany of Mercy",
"level": 2
},
{
"id": "jw565u3n",
"sectionId": "iluxmvzc",
"title": "Litany of Mercy > Verses",
"level": 3
},
{
"id": "nd29i6ml",
"sectionId": "iluxmvzc",
"title": "Intercession",
"level": 4
}
]

processed blocks: [
{
"id": "uz3qqyga",
"containerId": "cguujm95",
"type": "paragraph",
"text": "A player has three vitality bars instead of the conventional two. [[ref:8zb9mn9c/swxot2t9:Blood]] is health. [[ref:8zb9mn9c/v00murdo:Phlegm]] is the momentum/adrenaline equivalent, built through combat and spent on powerful abilities. [[ref:8zb9mn9c/jgnkiqde:Bile]] is a unique balancing bar ranging from {{var:8tkoq4fg:bile_min}} to {{var:5n9aybx6:bile_max}} that naturally settles at centre. Pushing bile toward corruption (negative) increases damage dealt and taken. Pushing toward purity (positive) increases survivability. ",
"items": "",
"headers": "",
"rows": "",
"ordered": "",
"heading": "",
"headingLevel": ""
},
{
"id": "tp9aozxb",
"containerId": "swxot2t9",
"type": "paragraph",
"text": "Equivalent to the traditional Health resource. When Blood reaches {{var:l8nm7u92:blood_min}}, you die. ",
"items": "",
"headers": "",
"rows": "",
"ordered": "",
"heading": "",
"headingLevel": ""
},
{
"id": "qrqxfhtv",
"containerId": "v00murdo",
"type": "paragraph",
"text": "Phlegm is a resource used or gained when casting abilities (and performing certain other combat related actions).",
"items": "",
"headers": "",
"rows": "",
"ordered": "",
"heading": "",
"headingLevel": ""
},
{
"id": "rf5fblxi",
"containerId": "jgnkiqde",
"type": "paragraph",
"text": "Bile is a unique concept. Rather than being a range from 0 to 100, Bile takes the shape of a three step range from {{var:8tkoq4fg:bile_min}} to {{var:evnen58i:bile_neutral}} to {{var:5n9aybx6:bile_max}}. In general, Bile is a stat modifier that can affect damage and damage taken, however it also works as a threshold for performing certain combat actions (particularly in the [[ref:s1q9idbh:Occultism]] Combat Style). \n",
"items": "",
"headers": "",
"rows": "",
"ordered": "",
"heading": "",
"headingLevel": ""
},
{
"id": "yjhtefcp",
"containerId": "l82wezo6",
"type": "paragraph",
"text": "Prowess is both a skill and a combat style. It is tightly associated with the Religion skill. In addition to traditional combat abilities native to the skill, it massively benefits from Litanies and Verses from Religion.\n\nWhen wielding [[ref:dsm5vy4y:Prowess (melee)]] equipment, you have access to more [[ref:iluxmvzc/bd5j0ree:Litanies & Verses]] than any other combat style has. Litanies can be thought of as stances you lock into for a given duration. Verses are sort of like spells and have a resource cost of materials produced through Rituals in the [[ref:iluxmvzc:Religion]] Skill. Some verses are generally available, while others are tied to a Litany.\n",
"items": "",
"headers": "",
"rows": "",
"ordered": "",
"heading": "",
"headingLevel": ""
},
{
"id": "eycjod7y",
"containerId": "4bs00gvh",
"type": "paragraph",
"text": "",
"items": "",
"headers": "",
"rows": "",
"ordered": "",
"heading": "",
"headingLevel": ""
},
{
"id": "3kbzejfu",
"containerId": "bd5j0ree",
"type": "paragraph",
"text": "Litanies can be thought of as stances, and are core to dealing good damage, especially with [[ref:dsm5vy4y:Prowess (melee)]]. Verses are sort of like spells or abilities. Certain Verses are always available ([[ref:iluxmvzc/gb2bads7:Universal Verses]]), others require a specific Litany to be active.",
"items": "",
"headers": "",
"rows": "",
"ordered": "",
"heading": "",
"headingLevel": ""
},
{
"id": "6adaiv62",
"containerId": "gb2bads7",
"type": "paragraph",
"text": "These Verses are available to all Combat Styles, regardless of active Litany. They share cooldowns and costs but do not benefit from Litany-specific sequencing bonuses (unless otherwise noted).",
"items": "",
"headers": "",
"rows": "",
"ordered": "",
"heading": "",
"headingLevel": ""
},
{
"id": "psalm-1-desc",
"containerId": "recite-first-psalm",
"type": "paragraph",
"text": "Deal minimal damage. Generate 10% additional [[ref:8zb9mn9c/v00murdo:Phlegm]]. No Scripture cost.",
"items": "",
"headers": "",
"rows": "",
"ordered": "",
"heading": "",
"headingLevel": ""
},
{
"id": "reprieve-desc",
"containerId": "verse-reprieve",
"type": "paragraph",
"text": "Consume a Page of Rest to heal for 15% of your missing Blood over 6 ticks. Cannot be used while **Stigmata** is active (Wrath only restriction).",
"items": "",
"headers": "",
"rows": "",
"ordered": "",
"heading": "",
"headingLevel": ""
},
{
"id": "focus-desc",
"containerId": "canticle-focus",
"type": "paragraph",
"text": "For the next 10 ticks, your next Verse costs 25% less Phlegm and has its cooldown reduced by 3 seconds. Does not stack with itself.",
"items": "",
"headers": "",
"rows": "",
"ordered": "",
"heading": "",
"headingLevel": ""
},
{
"id": "urgency-desc",
"containerId": "doxology-urgency",
"type": "paragraph",
"text": "Instantly reduce your active Litany's remaining lock-in duration by 6 seconds. Cannot reduce lock-in below 5 seconds.",
"items": "",
"headers": "",
"rows": "",
"ordered": "",
"heading": "",
"headingLevel": ""
},
{
"id": "echo-desc",
"containerId": "litany-echo",
"type": "paragraph",
"text": "Repeat the last Verse you cast (from any Litany) at 50% effectiveness. Does not trigger sequencing bonuses or consume additional Scripture pages.",
"items": "",
"headers": "",
"rows": "",
"ordered": "",
"heading": "",
"headingLevel": ""
},
{
"id": "0ph94x33",
"containerId": "cy8n4jx9",
"type": "paragraph",
"text": "",
"items": "",
"headers": "",
"rows": "",
"ordered": "",
"heading": "",
"headingLevel": ""
},
{
"id": "cekmtj9g",
"containerId": "jw565u3n",
"type": "paragraph",
"text": "These Verses are only available while Litany of Mercy is active.",
"items": "",
"headers": "",
"rows": "",
"ordered": "",
"heading": "",
"headingLevel": ""
},
{
"id": "gg1faokn",
"containerId": "nd29i6ml",
"type": "list",
"text": "",
"items": "Something goes here, Something goes there",
"headers": "",
"rows": "",
"ordered": "true",
"heading": "",
"headingLevel": ""
}
]

processed variables: [
{
"id": "5n9aybx6",
"sectionId": "8zb9mn9c",
"name": "bile_max",
"value": "100"
},
{
"id": "8tkoq4fg",
"sectionId": "8zb9mn9c",
"name": "bile_min",
"value": "-100"
},
{
"id": "evnen58i",
"sectionId": "8zb9mn9c",
"name": "bile_neutral",
"value": "0"
},
{
"id": "l8nm7u92",
"sectionId": "8zb9mn9c",
"name": "blood_min",
"value": "0"
}
]
