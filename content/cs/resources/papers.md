---
title: Papers
description: Peer-reviewed and preprint publications the garden's notes cite, grouped by area with back-links to the notes that use them.
draft: false
comments: true
tags:
  - cs
  - resources
  - resource/paper
date: 2026-07-26
updated:
aliases:
  - Papers
---

Every paper below is cited by at least one note in this garden, and the back-links say which. Titles, author lists, and years were read off each publisher's own page rather than from memory, so the citations here match the record. Where a note leans on a paper for a specific claim, that note's own `## Sources` section says which claim.

### Architectures and representation learning

**[Attention Is All You Need](https://arxiv.org/abs/1706.03762)** (2017), Ashish Vaswani, Noam Shazeer, Niki Parmar et al. The transformer. Cited by [[cs/deep-learning/attention-and-transformers|Attention and Transformers]].

**[BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding](https://arxiv.org/abs/1810.04805)** (2018), Jacob Devlin, Ming-Wei Chang, Kenton Lee et al. Cited by [[cs/deep-learning/attention-and-transformers|Attention and Transformers]].

**[Deep Residual Learning for Image Recognition](https://arxiv.org/abs/1512.03385)** (2015), Kaiming He, Xiangyu Zhang, Shaoqing Ren et al. Residual connections. Cited by [[cs/deep-learning/pooling-and-cnn-architectures|Pooling and CNN Architectures]].

**[U-Net: Convolutional Networks for Biomedical Image Segmentation](https://arxiv.org/abs/1505.04597)** (2015), Olaf Ronneberger, Philipp Fischer, Thomas Brox. Cited by [[cs/deep-learning/diffusion-models|Diffusion Models]].

**[Learning Phrase Representations using RNN Encoder-Decoder for Statistical Machine Translation](https://arxiv.org/abs/1406.1078)** (2014), Kyunghyun Cho, Bart van Merrienboer, Caglar Gulcehre et al. The GRU. Cited by [[cs/deep-learning/recurrent-neural-networks|Recurrent Neural Networks]].

**[Efficient Estimation of Word Representations in Vector Space](https://arxiv.org/abs/1301.3781)** (2013), Tomas Mikolov, Kai Chen, Greg Corrado et al. word2vec. Cited by [[cs/deep-learning/embeddings|Embeddings]].

**[Distributed Representations of Words and Phrases and their Compositionality](https://arxiv.org/abs/1310.4546)** (2013), Tomas Mikolov, Ilya Sutskever, Kai Chen et al. Cited by [[cs/deep-learning/embeddings|Embeddings]].

**[node2vec: Scalable Feature Learning for Networks](https://arxiv.org/abs/1607.00653)** (2016), Aditya Grover, Jure Leskovec. Cited by [[cs/deep-learning/embeddings|Embeddings]].

### Generative models

**[Generative Adversarial Networks](https://arxiv.org/abs/1406.2661)** (2014), Ian J. Goodfellow, Jean Pouget-Abadie, Mehdi Mirza et al. Cited by [[cs/deep-learning/generative-adversarial-networks|GANs]].

**[Auto-Encoding Variational Bayes](https://arxiv.org/abs/1312.6114)** (2013), Diederik P Kingma, Max Welling. The VAE. Cited by [[cs/deep-learning/autoencoders|Autoencoders]].

**[Denoising Diffusion Probabilistic Models](https://arxiv.org/abs/2006.11239)** (2020), Jonathan Ho, Ajay Jain, Pieter Abbeel. Cited by [[cs/deep-learning/diffusion-models|Diffusion Models]].

### Training, optimization, and initialization

**[Adam: A Method for Stochastic Optimization](https://arxiv.org/abs/1412.6980)** (2014), Diederik P. Kingma, Jimmy Ba. Cited by [[cs/deep-learning/faster-optimizers-and-learning-rate-scheduling|Faster Optimizers and LR Scheduling]], [[cs/machine-learning/gradient-descent|Gradient Descent]].

**[An overview of gradient descent optimization algorithms](https://arxiv.org/abs/1609.04747)** (2016), Sebastian Ruder. Cited by [[cs/machine-learning/gradient-descent|Gradient Descent]].

**[Batch Normalization: Accelerating Deep Network Training by Reducing Internal Covariate Shift](https://arxiv.org/abs/1502.03167)** (2015), Sergey Ioffe, Christian Szegedy. Cited by [[cs/deep-learning/regularization-in-deep-learning|Regularization in Deep Learning]], [[cs/deep-learning/vanishing-and-exploding-gradients|Vanishing and Exploding Gradients]].

**[Understanding the difficulty of training deep feedforward neural networks](https://proceedings.mlr.press/v9/glorot10a.html)** (2010), Xavier Glorot, Yoshua Bengio. Xavier initialization. Cited by [[cs/deep-learning/activation-functions|Activation Functions]], [[cs/deep-learning/vanishing-and-exploding-gradients|Vanishing and Exploding Gradients]].

**[Deep Sparse Rectifier Neural Networks](https://proceedings.mlr.press/v15/glorot11a.html)** (2011), Xavier Glorot, Antoine Bordes, Yoshua Bengio. The ReLU case. Cited by [[cs/deep-learning/activation-functions|Activation Functions]].

**[Delving Deep into Rectifiers: Surpassing Human-Level Performance on ImageNet Classification](https://arxiv.org/abs/1502.01852)** (2015), Kaiming He, Xiangyu Zhang, Shaoqing Ren et al. He initialization and PReLU. Cited by [[cs/deep-learning/vanishing-and-exploding-gradients|Vanishing and Exploding Gradients]].

**[On the difficulty of training Recurrent Neural Networks](https://arxiv.org/abs/1211.5063)** (2012), Razvan Pascanu, Tomas Mikolov, Yoshua Bengio. Gradient clipping. Cited by [[cs/deep-learning/vanishing-and-exploding-gradients|Vanishing and Exploding Gradients]].

**[On the importance of initialization and momentum in deep learning](https://proceedings.mlr.press/v28/sutskever13.html)** (2013), Ilya Sutskever, James Martens, George Dahl et al. Cited by [[cs/deep-learning/faster-optimizers-and-learning-rate-scheduling|Faster Optimizers and LR Scheduling]].

**[Super-Convergence: Very Fast Training of Neural Networks Using Large Learning Rates](https://arxiv.org/abs/1708.07120)** (2017), Leslie N. Smith, Nicholay Topin. Cited by [[cs/deep-learning/faster-optimizers-and-learning-rate-scheduling|Faster Optimizers and LR Scheduling]].

**[XGBoost: A Scalable Tree Boosting System](https://arxiv.org/abs/1603.02754)** (2016), Tianqi Chen, Carlos Guestrin. Cited by [[cs/machine-learning/decision-trees-and-ensembles|Decision Trees and Ensembles]].

### Transfer, meta-learning, and interpretability

**[How transferable are features in deep neural networks?](https://arxiv.org/abs/1411.1792)** (2014), Jason Yosinski, Jeff Clune, Yoshua Bengio et al. Cited by [[cs/deep-learning/transfer-learning|Transfer Learning]].

**[Model-Agnostic Meta-Learning for Fast Adaptation of Deep Networks](https://arxiv.org/abs/1703.03400)** (2017), Chelsea Finn, Pieter Abbeel, Sergey Levine. MAML. Cited by [[cs/deep-learning/meta-learning|Meta-Learning]].

**[Meta-Learning in Neural Networks: A Survey](https://arxiv.org/abs/2004.05439)** (2020), Timothy Hospedales, Antreas Antoniou, Paul Micaelli et al. Cited by [[cs/deep-learning/meta-learning|Meta-Learning]].

**[Deep Inside Convolutional Networks: Visualising Image Classification Models and Saliency Maps](https://arxiv.org/abs/1312.6034)** (2013), Karen Simonyan, Andrea Vedaldi, Andrew Zisserman. Cited by [[cs/deep-learning/feature-attribution-and-saliency|Feature Attribution and Saliency]].

**[Axiomatic Attribution for Deep Networks](https://arxiv.org/abs/1703.01365)** (2017), Mukund Sundararajan, Ankur Taly, Qiqi Yan. Integrated gradients. Cited by [[cs/deep-learning/feature-attribution-and-saliency|Feature Attribution and Saliency]].

### Reinforcement learning

**[Playing Atari with Deep Reinforcement Learning](https://arxiv.org/abs/1312.5602)** (2013), Volodymyr Mnih, Koray Kavukcuoglu, David Silver et al. Cited by [[cs/deep-learning/deep-reinforcement-learning|Deep Reinforcement Learning]].

**[Human-level control through deep reinforcement learning](https://www.nature.com/articles/nature14236)** (2015), Volodymyr Mnih, Koray Kavukcuoglu, David Silver et al., *Nature*. DQN. Cited by [[cs/deep-learning/deep-reinforcement-learning|Deep Reinforcement Learning]].

**[Mastering the game of Go with deep neural networks and tree search](https://www.nature.com/articles/nature16961)** (2016), David Silver, Aja Huang, Chris J. Maddison et al., *Nature*. AlphaGo. Cited by [[cs/deep-learning/deep-reinforcement-learning|Deep Reinforcement Learning]].

### Applications and fairness

**[Unsupervised word embeddings capture latent knowledge from materials science literature](https://www.nature.com/articles/s41586-019-1335-8)** (2019), Vahe Tshitoyan, John Dagdelen, Leigh Weston et al., *Nature*. Cited by [[cs/deep-learning/embeddings|Embeddings]].

**[Inherent Trade-Offs in the Fair Determination of Risk Scores](https://arxiv.org/abs/1609.05807)** (2016), Jon Kleinberg, Sendhil Mullainathan, Manish Raghavan. Cited by [[cs/ethics/the-impossibility-of-algorithmic-fairness|The Impossibility of Algorithmic Fairness]].

**[Fair prediction with disparate impact: A study of bias in recidivism prediction instruments](https://arxiv.org/abs/1703.00056)** (2017), Alexandra Chouldechova. Cited by [[cs/ethics/the-impossibility-of-algorithmic-fairness|The Impossibility of Algorithmic Fairness]].

**[People are not coins. Morally distinct types of predictions necessitate different fairness constraints](https://arxiv.org/abs/2204.10305)** (2022), Eleonora Vigano', Corinna Hertweck, Christoph Heitz et al. Cited by [[cs/ethics/the-impossibility-of-algorithmic-fairness|The Impossibility of Algorithmic Fairness]].

**[What's Sex Got To Do With Fair Machine Learning?](https://arxiv.org/abs/2006.01770)** (2020), Lily Hu, Issa Kohler-Hausmann. Cited by [[cs/ethics/social-categories-and-machine-learning|Social Categories and Machine Learning]].

**[Could a Large Language Model be Conscious?](https://arxiv.org/abs/2303.07103)** (2023), David J. Chalmers. Cited by [[cs/ethics/could-an-llm-be-conscious|Could an LLM Be Conscious?]].

### Security

**[The Protection of Information in Computer Systems](https://web.mit.edu/Saltzer/www/publications/protection/Basic.html)**, Jerome H. Saltzer and Michael D. Schroeder. The invited paper that gave the field least privilege and the rest of its design principles. Cited by [[cs/security/privilege-separation-and-least-privilege|Privilege Separation and Least Privilege]].

**[A Future-Adaptable Password Scheme](https://www.usenix.org/legacy/event/usenix99/provos/provos.pdf)** (1999), Niels Provos and David Mazieres, FREENIX Track, USENIX Annual Technical Conference. bcrypt. Cited by [[cs/security/password-hashing-and-salting|Password Hashing and Salting]].

**[Preventing Privilege Escalation](https://www.usenix.org/legacy/events/sec03/tech/full_papers/provos_et_al/provos_et_al.pdf)** (2003), Niels Provos, Markus Friedl, and Peter Honeyman, 12th USENIX Security Symposium. Privilege separation in OpenSSH. Cited by [[cs/security/privilege-separation-and-least-privilege|Privilege Separation and Least Privilege]].

### Philosophy of mind and computation

Peer-reviewed entries from the *Stanford Encyclopedia of Philosophy*, which the ethics and language-theory notes lean on.

**[The Lambda Calculus](https://plato.stanford.edu/entries/lambda-calculus/)**, Jesse Alama and Johannes Korbmacher. Cited by [[cs/pl/lambda-calculus-syntax-substitution|Lambda Calculus: Syntax and Substitution]].

**[Consciousness](https://plato.stanford.edu/entries/consciousness/)** (2004), Robert Van Gulick. Cited by [[cs/ethics/consciousness-access-vs-phenomenal|Consciousness: Access vs Phenomenal]].

**[Higher-Order Theories of Consciousness](https://plato.stanford.edu/entries/consciousness-higher/)** (2001), Peter Carruthers and Rocco Gennaro. Cited by [[cs/ethics/scientific-theories-of-consciousness|Scientific Theories of Consciousness]].

**[Functionalism](https://plato.stanford.edu/entries/functionalism/)** (2004), Janet Levin. Cited by [[cs/ethics/functionalism-and-multiple-realizability|Functionalism and Multiple Realizability]], [[cs/ethics/the-biological-substrate-objection|The Biological Substrate Objection]].

**[Multiple Realizability](https://plato.stanford.edu/entries/multiple-realizability/)** (1998), John Bickle. Cited by [[cs/ethics/functionalism-and-multiple-realizability|Functionalism and Multiple Realizability]].

**[Physicalism](https://plato.stanford.edu/entries/physicalism/)** (2001), Daniel Stoljar. Cited by [[cs/ethics/physicalism-and-the-mind|Physicalism and the Mind]].

**[Moral Responsibility](https://plato.stanford.edu/entries/moral-responsibility/)** (2019), Matthew Talbert. Cited by [[cs/ethics/fairness-as-equal-concern|Fairness as Equal Concern]].

## Related Notes

- [[cs/resources/index|Resources]]
- [[cs/resources/books|Books]]
- [[cs/resources/courses|Courses]]
- [[cs/resources/code|Code]]

## Sources

- arXiv abstract pages for every arXiv entry above. https://arxiv.org/abs/1706.03762 . Titles, author lists, and years were read from each paper's own abstract page citation metadata.
- Proceedings of Machine Learning Research. https://proceedings.mlr.press/v9/glorot10a.html . Titles and authors for the Glorot and Sutskever entries.
- Nature. https://www.nature.com/articles/nature14236 . Titles and author lists for the three Nature entries.
- USENIX. https://www.usenix.org/legacy/event/usenix99/provos/provos.pdf . Title "A Future-Adaptable Password Scheme", authors "Niels Provos and David Mazieres", FREENIX Track of the 1999 USENIX Annual Technical Conference.
- USENIX. https://www.usenix.org/legacy/events/sec03/tech/full_papers/provos_et_al/provos_et_al.pdf . Title "Preventing Privilege Escalation", authors Niels Provos, Markus Friedl, and Peter Honeyman, 12th USENIX Security Symposium, 2003.
- MIT. https://web.mit.edu/Saltzer/www/publications/protection/ . Title "The Protection of Information in Computer Systems" and the author line "JEROME H. SALTZER, SENIOR MEMBER, IEEE, AND MICHAEL D. SCHROEDER, MEMBER, IEEE".
- Stanford Encyclopedia of Philosophy. https://plato.stanford.edu/entries/lambda-calculus/ . Entry titles and authors from each entry's citation metadata.
