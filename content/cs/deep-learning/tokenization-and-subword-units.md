---
title: Tokenization and Subword Units
description: How text becomes a sequence of integers, why words and characters are both bad answers, and how BPE and WordPiece build a vocabulary that sits between them.
draft: false
comments: true
tags:
  - cs
  - deep-learning
date: 2026-05-27
aliases:
  - tokenization
  - BPE
  - byte pair encoding
  - WordPiece
  - subword units
---

A neural network consumes numbers. Text is [[cs/dsa/strings|a string]]. Something has to sit between them, chopping the string into units and mapping each unit to an index in a fixed vocabulary, and the design of that chopping step quietly constrains everything the model can do. The tokenizer decides what the model is even able to see.

> [!note] The idea
> Tokenization is a compression problem wearing a machine-learning costume. Split on words and the vocabulary explodes while anything unseen becomes an opaque unknown token; split on characters and nothing is ever unknown but the sequences get long and each unit carries almost no meaning. Subword tokenizers resolve the tension by making unit size frequency-dependent: common words stay whole, rare words fall apart into pieces the model has seen before. The vocabulary size stops being a property of the language and becomes a knob you turn.

## The two bad answers at the ends

Word-level tokenization splits on spaces, punctuation, or language-specific rules, so `"Don't you love 🤗 Transformers?"` becomes something like `["Do", "n't", "you", "love", "🤗", "Transformers", "?"]`. Every unique word needs its own vocabulary entry, and every inflection counts separately: `love`, `loving`, `loved`, and `lovingly` are four unrelated indices. The vocabulary becomes extremely large, the [[cs/deep-learning/embeddings|embedding]] matrix grows with it, and memory and compute go up accordingly. Worse, anything absent from the vocabulary maps to a single `<unk>` token, so the model simply cannot handle new words.

Character-level tokenization inverts every property. The vocabulary is tiny, every word is representable, and there is no unknown-token problem at all. The cost is that sequences become much longer, and a character like `l` carries far less meaning than the word `love`, so performance suffers. For a [[cs/deep-learning/attention-and-transformers|transformer]] whose attention cost grows quadratically in sequence length, longer sequences are not a small price.

## Subword units, learned from frequency

Subword tokenizers split text into units between words and characters, keeping the vocabulary compact while still capturing meaningful pieces. Common words stay intact as single tokens; rare or unknown words decompose into subwords. `annoyingly` might be split into `["annoying", "ly"]` or `["annoy", "ing", "ly"]` depending on the vocabulary. Because a word can be rebuilt from its parts, the model can represent unseen words from known subwords, which is exactly the failure that word-level tokenization could not survive.

Sennrich, Haddow, and Birch made the argument in the machine-translation setting in 2015. Their framing is sharp: neural MT models typically operate with a fixed vocabulary, but translation is an open-vocabulary problem. Earlier systems handled out-of-vocabulary words by backing off to a dictionary; they proposed encoding rare and unknown words as sequences of subword units instead, on the intuition that various word classes are translatable via smaller units than words (names via character copying or transliteration, compounds via compositional translation, cognates and loanwords via phonological and morphological transformations). Empirically, subword models beat a back-off dictionary baseline on the WMT 15 English-German and English-Russian tasks by 1.1 and 1.3 BLEU respectively.

## BPE: a 1994 compression algorithm, repurposed

Byte-pair encoding was first described in 1994 by Philip Gage as a way to encode strings of text into smaller strings using a translation table. The original algorithm replaces the [[cs/dsa/huffman-coding|highest-frequency pair]] of bytes with a byte not present in the data and records the substitution, repeating until nothing repeats.

> [!example] The original compression run
> Encoding `aaabdaaabac`: the pair `aa` occurs most often, so replace it with an unused byte `Z`, giving `ZabdZabac` with `Z=aa`. Then `ab` becomes `Y`: `ZYdZYac`, `Y=ab`, `Z=aa`. Continue recursively and `ZY` becomes `X`, giving `XdXac`. Decompression is the same replacements in reverse order.

The tokenizer version keeps the merge loop and changes the objective. Compared to the original BPE, the modified version does not aim to maximally compress text but to encode plaintext into tokens, which are natural numbers. It starts by treating each unique character as a one-character token, then repeatedly merges the most frequent adjacent pair into a new longer token, replacing all instances, until the vocabulary reaches a prescribed size. Since the base characters stay in the vocabulary, new words can always be constructed from the final tokens and the initial character set.

The vocabulary target is where the tradeoff gets dialed in. Hugging Face's documentation gives the arithmetic directly: target vocabulary size equals base vocabulary size plus number of merges. GPT used BPE with a vocabulary of 40,478 (478 base tokens plus 40,000 merges). More merges means shorter sequences and a bigger embedding table; fewer means the reverse.

## Killing the unknown token entirely

Even a character-level base vocabulary has a hole in it. Include all [[cs/languages/common/text-encoding-and-unicode|Unicode characters]] and the base vocabulary becomes enormous; include only the characters seen in training and some symbol, somewhere, in some script, is unencodable and gets replaced by `<unk>`.

Byte-level BPE closes the hole by construction. Convert the text to UTF-8 first and treat it as a stream of bytes, which gives a base vocabulary of 256 byte values and guarantees that any UTF-8 text can be encoded without an unknown token. GPT-2 uses byte-level BPE with a vocabulary size of 50,257: 256 byte tokens, 50,000 merges, and one special end-of-text token. The approach also appears in BERT-family models like RoBERTa, BART, and DeBERTa.

## WordPiece: merge by informativeness, not frequency

WordPiece is the tokenization algorithm for BERT-family models such as DistilBERT and Electra. Structurally it looks like BPE, iteratively merging pairs from the bottom up, and differs in one place: how it picks which pair to merge. BPE merges whichever pair appears most often. WordPiece merges pairs that maximize the likelihood of the training data, scoring a candidate pair by

$$\text{score}(u, g) = \frac{\text{freq}(ug)}{\text{freq}(u) \times \text{freq}(g)}$$

The denominator is the giveaway. A pair of individually common tokens has to co-occur very often to score well, while a pair of rare tokens that almost always appear together scores high on modest counts. WordPiece is asking how informative each merge is, not how frequent, and merges the pairs whose combination appears far more often than chance predicts.

> [!warning] The tokenizer is a fixed, learned artifact
> A vocabulary is fit on a corpus and then frozen with the model. Text that looks unlike the training corpus (other scripts, code, chemical names, long numbers) fragments into many more tokens than English prose does, consuming context window and compute for the same content. And whether a model "sees" a word as one unit or five is a property of the tokenizer, not of the language.

## Related Notes

- [[cs/deep-learning/embeddings]], what each token index gets looked up into
- [[cs/deep-learning/attention-and-transformers]], the architecture whose sequence-length cost makes token granularity matter
- [[cs/deep-learning/self-supervised-learning-and-pretraining]], where the token vocabulary becomes the prediction target
- [[cs/deep-learning/recurrent-neural-networks]], the earlier sequence models that faced the same vocabulary problem
- [[cs/machine-learning/features-and-representations]], tokenization as the first representation choice in the pipeline

## Sources

- "Tokenization algorithms," Hugging Face Transformers documentation. https://huggingface.co/docs/transformers/en/tokenizer_summary . Supports the word-level and character-level tradeoffs, the subword definition and the `annoyingly` example, BPE merge mechanics and the base-plus-merges vocabulary arithmetic, GPT's 40,478 and GPT-2's 50,257 vocabulary sizes, byte-level BPE's 256-value base, and the WordPiece scoring formula and its contrast with BPE.
- "Byte-pair encoding," Wikipedia. https://en.wikipedia.org/wiki/Byte-pair_encoding . Supports Gage's 1994 origin as a compression algorithm, the `aaabdaaabac` worked example, the modified language-model variant not aiming for maximal compression, and byte-level BPE's use in RoBERTa, BART, DeBERTa, and GPT-2.
- Rico Sennrich, Barry Haddow, and Alexandra Birch, "Neural Machine Translation of Rare Words with Subword Units," arXiv:1508.07909. https://arxiv.org/abs/1508.07909 . Supports the fixed-vocabulary versus open-vocabulary framing, the dictionary back-off baseline, the intuition about names, compounds, cognates and loanwords, and the 1.1 and 1.3 BLEU improvements on WMT 15.
