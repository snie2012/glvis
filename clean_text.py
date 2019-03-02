import re
import string
from nltk.corpus import stopwords

def remove_tags(sentence):
    # Remove HTML tags
    tags = re.compile('<.*?>')
    return re.sub(tags, '', sentence)

def remove_digits(sentence):
    # Remove digits
    digits = re.compile('\d+')
    return re.sub(digits, '', sentence)

def remove_punctuations(sentence):
    # Remove punctuations
    translator = str.maketrans('', '', string.punctuation)
    return sentence.translate(translator)

def clean_text(sentence):
    # Remove HTML tags, digits and punctuations
    sentence = remove_punctuations(remove_digits(remove_tags(sentence)))

    # Turn string to lower case and split into words
    wordlist = sentence.strip().lower().split(' ')

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