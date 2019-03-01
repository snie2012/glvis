import re
import string
from nltk.corpus import stopwords

def clean_text(sentence):
    # Remove HTML tags
    tags = re.compile('<.*?>')
    removed = re.sub(tags, '', sentence)

    # Remove digits
    digits = re.compile('\d+')
    removed = re.sub(digits, '', removed)

    # Remove punctuations
    translator = str.maketrans('', '', string.punctuation)
    translated = removed.translate(translator)

    # Turn string to lower case and split into words
    wordlist = translated.strip().lower().split(' ')

    # Remove stop words
    # and words that do not make sense in the specific application domain
    stopset = set(stopwords.words('english'))
    extra = set([
        '',
        'movie', 
        'film'
    ])
    unionstop = stopset | extra

    return list(filter(lambda w: w not in unionstop, wordlist))