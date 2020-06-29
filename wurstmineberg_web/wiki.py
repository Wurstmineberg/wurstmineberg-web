import re

import wurstmineberg_web.models

DISCORD_MENTION_REGEX = re.compile(f'<@!?({wurstmineberg_web.models.WMBID_REGEX.pattern}|[0-9]+)>')
DISCORD_TAG_REGEX = re.compile('@([^@#:\n]{2,32})#((?:[0-9]{4})?)') # see  # see https://discord.com/developers/docs/resources/user

def mentions_to_tags(text):
    while True:
        match = DISCORD_MENTION_REGEX.search(text)
        if not match:
            return text
        person = wurstmineberg_web.models.Person.from_snowflake_or_wmbid(match.group(1))
        if person.discorddata is None:
            tag = f'@{person.wmbid}#'
        else:
            tag = f'@{person.discorddata["username"]}#{person.discorddata["discriminator"]:04}'
        text = f'{text[:match.start()]}{tag}{text[match.end():]}'

def tags_to_mentions(text):
    while True:
        match = DISCORD_TAG_REGEX.search(text)
        if not match:
            return text
        person = wurstmineberg_web.models.Person.from_tag(match.group(1), None if match.group(2) == '' else int(match.group(2)))
        if person is None:
            # skip this tag but convert the remaining text recursively
            return f'{tags_to_mentions(text[:match.start()])}{match.group(0)}{tags_to_mentions(text[match.end():])}'
        else:
            text = f'{text[:match.start()]}<@{person.snowflake_or_wmbid}>{text[match.end():]}'
