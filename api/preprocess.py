import re
import ftfy
import unicodedata

# =====================================================
# NORMALISASI SLANG
# =====================================================

SLANG_DICT = {

    "gk":"tidak",
    "ga":"tidak",
    "gak":"tidak",
    "nggak":"tidak",
    "enggak":"tidak",

    "yg":"yang",
    "aja":"saja",
    "udh":"sudah",
    "sdh":"sudah",
    "blm":"belum",
    "bgt":"banget",
    "trs":"terus",
    "tp":"tapi",
    "utk":"untuk",
    "jd":"jadi",
    "klu":"kalau",
    "klo":"kalau",
    "dr":"dari",
    "dgn":"dengan",

    "gw":"saya",
    "gue":"saya",
    "sy":"saya",
    "lu":"kamu",
    "loe":"kamu",

    "org":"orang",
    "krn":"karena",
    "sm":"sama",
    "min":"admin"
}

# =====================================================
# HOMOGLYPH
# =====================================================

HOMOGLYPH = {

    "А":"A","В":"B","Е":"E","К":"K","М":"M","Н":"H",
    "О":"O","Р":"P","С":"C","Т":"T","Х":"X","У":"Y",

    "а":"a","е":"e","о":"o","р":"p","с":"c",
    "х":"x","у":"y","к":"k","м":"m","н":"h",

    "Α":"A","Β":"B","Ε":"E","Η":"H",
    "Ι":"I","Κ":"K","Μ":"M","Ν":"N",
    "Ο":"O","Ρ":"P","Τ":"T","Χ":"X"

}

TRANSLATE_TABLE = str.maketrans(HOMOGLYPH)

HTML_RE = re.compile(r"<.*?>")
URL_RE = re.compile(r"http\S+")
WWW_RE = re.compile(r"www\S+")
MENTION_RE = re.compile(r"@\w+")
EMOJI_RE = re.compile(r"[\U00010000-\U0010ffff]", flags=re.UNICODE)
SPECIAL_RE = re.compile(r"[^A-Za-z0-9\s]")
SPACE_RE = re.compile(r"\s+")


def preprocess(text: str):

    text = str(text)

    text = ftfy.fix_text(text)

    text = unicodedata.normalize("NFKC", text)

    text = text.translate(TRANSLATE_TABLE)

    text = HTML_RE.sub(" ", text)
    text = URL_RE.sub(" ", text)
    text = WWW_RE.sub(" ", text)
    text = MENTION_RE.sub(" ", text)
    text = EMOJI_RE.sub(" ", text)
    text = SPECIAL_RE.sub(" ", text)

    text = text.lower()

    words = [
        SLANG_DICT.get(word, word)
        for word in text.split()
    ]

    text = " ".join(words)

    text = SPACE_RE.sub(" ", text)

    return text.strip()