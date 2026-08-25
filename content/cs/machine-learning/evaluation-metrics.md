---
title: Evaluation Metrics
description: Accuracy, the confusion matrix, precision and recall, F1, and ROC-AUC, and why one number rarely tells you whether a classifier is any good.
draft: false
comments: true
tags:
  - cs
  - machine-learning
date: 2026-07-13
aliases:
  - confusion-matrix
  - precision-recall
  - roc-auc
---

Accuracy is one number, and one number can hide the exact failure you care about. A classifier that is 96.7% accurate sounds excellent until you learn the positive class it exists to find makes up 2% of the data and it misses nearly all of it. Serious evaluation starts by breaking errors apart by type, then choosing summaries that match what mistakes actually cost in your problem. Everything below is computed on the held-out data from [[cs/machine-learning/train-validation-test]], never on what the model trained on.

> [!note] The idea
> The confusion matrix is the ground truth of classifier evaluation: it counts true positives, false positives, false negatives, and true negatives separately. Accuracy, precision, recall, F1, and ROC-AUC are each just a different summary of those counts, and each answers a different question.

## The Confusion Matrix

For a binary problem, cross true class against predicted class (Wikipedia also calls it an error matrix; one axis is the true class and the other the predicted class):

| | Predicted + | Predicted − |
|---|---|---|
| **Actually +** | true positive ($tp$) | false negative ($fn$) |
| **Actually −** | false positive ($fp$) | true negative ($tn$) |

This generalizes to any number of classes, where it shows at a glance which classes get confused with which. The two error types are rarely equal in cost: a false negative in cancer screening and a false positive in [[cs/security/phishing-and-social-engineering|spam filtering]] are different kinds of expensive, and the matrix is what lets you see them separately. In probability terms these cells are counts of joint events, and the row-versus-column rates you derive from them are conditional probabilities (the same bookkeeping as [[cs/statistics/bayes-rule]]).

## Accuracy, and Its Trap

Accuracy is $(tp + tn) / N$, the fraction right, equivalently one minus the average 0-1 loss from [[cs/machine-learning/loss-functions]]. It fails silently under class imbalance. The course example: a test set of 1000 examples with 20 positives and 980 negatives. A classifier that gets 2 of 20 positives and 965 of 980 negatives scores $(2 + 965)/1000 = 96.7\%$. Impressive, except the do-nothing classifier that always predicts negative scores $980/1000 = 98.0\%$ while catching zero positives. Whether you would rather have a 94.9% accurate model that catches 19 of 20 positives (at the cost of fifty [[cs/security/ids-and-ips|false alarms]]) depends entirely on what positives cost you, and accuracy alone cannot express that.

## Precision, Recall, and F1

Two questions matter when positives are rare and valuable. When the model says positive, how often is it right? That is **precision**, $tp / (tp + fp)$, also called positive predictive value: the fraction of retrieved instances that are relevant. Of the actual positives out there, how many did the model find? That is **recall**, $tp / (tp + fn)$, also called sensitivity: the fraction of relevant instances retrieved. The two fight each other: predict positive more eagerly and recall rises while precision falls. Precision and recall are also the standard lens when classes are imbalanced, precisely because neither is inflated by a large negative class.

The **F1 score** combines them as their harmonic mean, $F_1 = 2 \cdot \frac{\text{precision} \cdot \text{recall}}{\text{precision} + \text{recall}}$, which punishes lopsidedness: a model with precision 1.0 and recall 0.01 gets an F1 near 0.02, not near 0.5. The general $F_\beta$ variant weights recall $\beta$ times as heavily as precision when the two errors are not equally costly.

## ROC Curves and AUC

Most classifiers output a score or probability, and the hard labels come from thresholding it. Slide the threshold and you get a whole family of classifiers, from "always negative" to "always positive." The **ROC curve** ([[cs/military-computing/sosus-undersea-signal-processing|receiver operating characteristic]]) plots the true positive rate against the false positive rate at each threshold setting, tracing the tradeoff. A perfect ranker hugs the top-left corner; a coin flip walks the diagonal.

The **area under the curve (AUC)** compresses the curve into one threshold-free number with a clean interpretation: the AUC equals the probability that the classifier ranks a randomly chosen positive instance higher than a randomly chosen negative one. So 1.0 is a perfect ranking, 0.5 is chance. Because it evaluates the ranking rather than one operating point, AUC compares models before you have committed to a threshold. One caveat carried over from the precision-recall discussion: with a huge negative class, ROC curves can look comfortingly good while precision is terrible, so precision-recall curves are often the more honest picture for heavily imbalanced problems.

> [!example]
> A fraud model is evaluated on 10,000 transactions containing 100 frauds. It flags 150 transactions, of which 80 are actually fraud. Then $tp = 80$, $fp = 70$, $fn = 20$, $tn = 9830$. Accuracy is $9910/10000 = 99.1\%$, barely better than the 99.0% of never flagging anything. Precision is $80/150 \approx 0.533$ (half the analysts' caseload is wasted effort), recall is $80/100 = 0.80$ (a fifth of fraud sails through), and F1 is $2(0.533 \cdot 0.8)/(0.533 + 0.8) \approx 0.64$. Four numbers, four different and useful facts; accuracy alone told you almost nothing.

## Related Notes

- [[cs/machine-learning/train-validation-test]] governs which data these numbers may legally be computed on
- [[cs/machine-learning/loss-functions]] for 0-1 loss, the quantity accuracy inverts
- [[cs/statistics/bayes-rule]] for reading matrix-derived rates as conditional probabilities
- [[cs/statistics/hypothesis-testing]] for deciding whether a metric difference between two models is real
- [[cs/machine-learning/bias-variance-tradeoff]] on why great training-set metrics can mean nothing
- [[cs/machine-learning/supervised-learning]] for the classification setting all of this evaluates

## Sources

- https://en.wikipedia.org/wiki/Confusion_matrix (confusion/error matrix layout, true/false positives and negatives, one axis true class and the other predicted)
- https://en.wikipedia.org/wiki/Precision_and_recall (precision as fraction of retrieved instances that are relevant, positive predictive value; recall as fraction of relevant instances retrieved, sensitivity; suitability for imbalanced data)
- https://en.wikipedia.org/wiki/F-score (F1 as the harmonic mean of precision and recall; $F_\beta$ weighting)
- https://en.wikipedia.org/wiki/Receiver_operating_characteristic (ROC as TPR vs FPR across threshold settings; AUC as the probability a random positive is ranked above a random negative)
- Course framing: CSCE 479/879 (Stephen Scott, UNL), "Regularization and Performance Evaluation" lecture slides (the 20-positives-in-1000 accuracy example; confusion matrices, ROC, and precision-recall as richer views than a single error rate)
