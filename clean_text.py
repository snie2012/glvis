import re
import string

def clean_text(sentence):
    # Remove HTML tags
    tags = re.compile('<.*?>')
    tags_removed = re.sub(tags, '', sentence)

    # Remove punctuations
    translator = str.maketrans('', '', string.punctuation)
    translated = tags_removed.translate(translator)

    # Turn string to lower case and split into words
    return translated.lower().strip().split(' ')