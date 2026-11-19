# Evaluation methodology for tuning rules and small models that estimate street cross-sections from aerial imagery

Context: regression runs on 87 Prague and 94 Brno cuts against MTVU surface maps, and on 43 Slovak and Aachen cuts against city passports. The thresholds were tuned on those same cuts. The AI model's seed and number of epochs were chosen on Brno and on the target area. MTVU leaves out most on-street parking. Rule variants were tested many times on the same cuts.

Verification status: the full text of Roberts et al. 2017, Cawley and Talbot 2010, de Bruin et al. 2022, Dror et al. 2018 and Bouthillier et al. 2021 was opened, extracted from the PDF and read. Only abstracts or search snippets were available for Ploton et al. 2020 (nature.com redirected to a login), Meyer and Pebesma 2022 (PMC served a reCAPTCHA), Field and Welsh 2007, Stehman and Foody 2019 (the repository returned 403), Csurka et al. 2013, Recht et al. 2019, Northcutt et al. 2021, SpaceNet/APLS and LoveDA. Claims from those sources are flagged as "(abstract only)" below.

## 1. Independent test sets, leakage from tuning and selection, spatial autocorrelation and cross-city validation

### Takeaway
Any number measured on the same cuts that were used to tune thresholds, pick variants, or choose the seed and epoch count is a training or selection score, not an estimate of accuracy. It is biased optimistically, and the bias can be as large as the differences being compared. An honest estimate needs a test set that no decision has touched. For a tool that is meant to work in new cities, that test set should be blocked by city (or at least by street or district) rather than drawn at random from the tuned pool.

### Cited Findings
- **Selection bias from tuning on the evaluation data.** Over-fitting a model selection criterion such as CV error produces an optimistic bias. The authors say "the differences in performance due to model selection are shown to be often of comparable magnitude to the difference in performance between learning algorithms". Their remedy is that "model selection must be treated as an integral part of the model fitting process and performed afresh every time a model is fitted", for example by nested cross-validation ("double cross", Stone 1974). — [Cawley & Talbot 2010, JMLR 11:2079–2107](https://www.jmlr.org/papers/v11/cawley10a.html)
- **This happens even with few hyperparameters.** The conclusions say high variance of the criterion "can lead to over-fitting in model selection, and hence poor performance, even when the number of hyper-parameters is relatively small". Rigorous evaluation uses "multiple randomised partitionings of the available data, with model selection performed separately in each trial". The authors suggest regularisation or early stopping of the selection step to limit over-fitting. — [Cawley & Talbot 2010](https://www.jmlr.org/papers/v11/cawley10a.html)
- **Random CV on structured data underestimates error.** Ignoring temporal, spatial, hierarchical or phylogenetic structure in CV results "in serious underestimation of predictive error". Structured data also gives "ample opportunity for overfitting with non-causal predictors". Block CV "is nearly universally more appropriate than random cross-validation if the goal is predicting to new data or predictor space". The authors recommend block CV "wherever dependence structures exist in a dataset, even if no correlation structure is visible in the fitted model residuals". — [Roberts et al. 2017, Ecography 40:913–929](https://www.biometrie.uni-freiburg.de/mitarbeiter/dormann/roberts-et-al-2017-ecography.pdf)
- **How to set block size.** Roberts et al. give these rules:
  - The minimum blocking distance is the extent of autocorrelation in model residuals.
  - Larger blocks may be needed, because over-fitting with structural covariates can hide that autocorrelation.
  - Each block should be its own fold, so that as much data as possible is used for training.
  - Blocks should be no larger than necessary, and predictors should be represented equally across folds, so that the blocking does not cause unnecessary extrapolation.
  - Hierarchical or group blocking (by group, here a street or city) is one of the blocking options.
  - Their Table 1 maps random versus blocked CV, in structure and in predictor space, to "correct interpolation error" versus "correct extrapolation error".
  - [Roberts et al. 2017](https://www.biometrie.uni-freiburg.de/mitarbeiter/dormann/roberts-et-al-2017-ecography.pdf)
- **Ploton et al. 2020 (abstract only).** A random forest trained on a central African inventory of 11.8 million trees seemed to explain more than half of the biomass variation under non-spatial validation, but showed quasi-null predictive power under spatial validation. — [Ploton et al. 2020, Nat. Commun. 11:4540 (IRD record)](https://www.documentation.ird.fr/hor/fdi:010080646)
- **The counter-position.** de Bruin et al. argue that spatial CV "tends to produce overly pessimistic validation results" because many prediction points lie close to calibration points. The real problem is clustered or unrepresentative sampling, not proximity. In their tests, inverse sampling-intensity weighted CV had much smaller bias than blocked spatial CV for non-clustered to moderately clustered samples. For a strongly clustered design where large parts of the map are predicted by extrapolation, blocked spatial CV was closest to the truth. Their recommendation is conventional random CV for non-clustered samples, weighted CV for moderately clustered ones, and avoiding extrapolation by sampling more or by limiting the prediction area. They also note that a design-based estimate from a probability sample gives an unbiased estimate of map accuracy. — [de Bruin et al. 2022, Ecol. Inform. 69:101665](https://edepot.wur.nl/569552)
- **Meyer & Pebesma 2022 (abstract only).** Sparse and non-representative reference data can make accuracy assessment impossible for areas whose conditions differ strongly from the training data. A single global accuracy statistic can hide local variation in error. — [Meyer & Pebesma 2022, Nat. Commun. 13:2208](https://cris-portal.uni-muenster.de/portal/en/publication/79604923)
- **Re-using a test set (abstract only).** On newly collected test sets, accuracy fell by 11–14 % on ImageNet and 3–15 % on CIFAR-10. The authors attribute this to slightly harder images (distribution shift), not adaptive over-fitting from reuse. Rankings were largely preserved. — [Recht et al. 2019](https://arxiv.org/abs/1902.10811)

### Inferences
- **What our numbers actually are.**
  - The current figures are selection-biased: Prague and Brno within 1 m, Slovakia and Aachen kerbs within 0.5 m (26 → 42 %), Brno within 1 m (62 → 74 %).
  - The model's seed and epochs were chosen on Brno and the target area. The 74 % in Brno is therefore a validation score, not a test score.
  - Thresholds such as the 0.3 m step or the saturation cut-off were tuned on the regression cuts. Their gains ("51 → 53 %") are in-sample.
- **The two goals need different designs.**
  - Our deployment goal is extrapolation: new cities, new orthophoto sources, new countries. That calls for leave-one-city-out evaluation (Roberts: blocked structure and predictor space).
  - Within-city interpolation would only need street-blocked CV.
  - The de Bruin objection applies when the target is the same area that was sampled. It does not apply to us: we predict for cities with no truth at all.
- **Recommended split.**
  1. Freeze a hold-out set now and never look at it during tuning. Use new cuts in Prague and Brno, drawn by a probability sample (for example a random sample of street segments stratified by road class), at least one block away from tuning cuts on the same street.
  2. Keep one whole city as a pure test, for example Vienna (FMZK) or Berlin, wherever its surface map was not used to train the U-Net.
  3. Report tuning-set and hold-out numbers side by side.
- **The AI model's training cities.** The model learned on Prague, Vienna, Berlin and Hamburg. Prague and Brno regression numbers for the AI kerbs therefore include in-domain data (Prague). Only cities outside the training set (Brno, Slovakia, Aachen, others) measure transfer. Even then, Brno was used for choosing the seed and epochs, so it is no longer clean.
- **Choosing the seed and epochs.** Fix the selection rule in advance (for example "last epoch" or "best on Vienna validation tiles"), or average several seeds. Do not pick the best seed on the evaluation cities. This follows Cawley & Talbot's "selection inside each trial".

### Gaps
- I could not read Ploton's exact buffered-LOO numbers or Meyer & Pebesma's "area of applicability" method in full, because of access walls. The kNNDM/Milà et al. 2022 method (matching nearest-neighbour distance distributions between test and prediction points) is known only through de Bruin's citation.
- I found no remote-sensing paper specifically about cross-section or profile estimation from orthophotos and its validation design.

## 2. Confidence intervals for small samples, paired and cluster bootstrap, multiple comparisons, sample size

### Takeaway
With 40–100 cuts, a 2–3 percentage-point change in a within-tolerance share is well within sampling noise. Variants should be compared paired (same cuts, A versus B), with a bootstrap over the independent units: streets, or cities if pooled. Many variants have been tried on the same cuts, so either correct for multiplicity or, better, confirm the winners on a fresh hold-out.

### Cited Findings
- **Bootstrap and permutation tests.** Dror et al. recommend a sampling-based test (paired bootstrap or approximate randomization/permutation) when the test statistic has no known distribution. They warn that the bootstrap "is less effective for small test sets, as it assumes that the test set distribution does not deviate too much from the population distribution". They class a bootstrap on a small test set as inappropriate use. — [Dror et al. 2018, ACL](https://aclanthology.org/P18-1128.pdf)
- **Multiplicity.** "When testing multiple hypotheses... the probability of making one or more false claims may be very high". Only 3 of 110 ACL 2017 papers with multiple datasets corrected for it, all with Bonferroni. For results across dependent folds or datasets, they propose replicability analysis (K-Bonferroni) and declaring significance only if most folds reject. — [Dror et al. 2018](https://aclanthology.org/P18-1128.pdf)
- **Variance sources in ML benchmarks.**
  - Bootstrapping the data is the largest single source of variance in benchmark results. Model initialisation is generally under 50 % of the bootstrap variance.
  - The authors recommend randomising as many sources as possible (data sampling, seeds, augmentation, hyperparameter optimisation).
  - Do not compare means alone. Conclude "A is better than B" only if P(A>B) is significantly above 0.5 and plausibly above a threshold γ = 0.75, using percentile-bootstrap CIs.
  - Single-point comparisons gave about 10 % false positives and about 75 % false negatives in their simulations.
  - [Bouthillier et al. 2021, MLSys](https://arxiv.org/pdf/2103.03098)
- **Correlated errors widen the spread.** For accuracy-type measures, sampling noise is roughly binomial in n. When errors are correlated rather than i.i.d., "the degrees of freedom are smaller and the distribution is wider". — [Bouthillier et al. 2021](https://arxiv.org/pdf/2103.03098)
- **Cluster bootstrap (abstract only).** Resampling whole clusters gives consistent variance estimates under both the transformation model and the random-effect model, whereas the residual bootstrap does so only under the transformation model. — [Field & Welsh 2007, JRSS-B 69:369–390 (RePEc)](https://ideas.repec.org/a/bla/jorssb/v69y2007i3p369-390.html)

### Inferences
- **How noisy a share is.** With binomial noise and n ≈ 90, a share near 50 % has a standard error of about √(0.25/90) ≈ 5.3 pp. That is about 10 pp for a 95 % interval on a single share. "47 → 45 %" or "51 → 53 %" is therefore noise unless the comparison is paired.
- **Paired comparison.** Pairing helps because most cuts give the same result under both variants. Count the discordant cuts, as was done for "better 22, worse 14 of 43". An exact sign test (McNemar-type) on 22 versus 14 gives two-sided p ≈ 0.24, so that result is not significant. This is my calculation, not from a source.
- **Bootstrap unit.** Several cuts on one street, or sides of the same cut, are not independent. Resample whole streets, and for a pooled CZ/SK/DE score resample cities, then report the 95 % percentile CI of the paired difference. With few cities, a city-level bootstrap is unreliable (Dror's small-sample caveat). In that case report per city and use leave-one-city-out.
- **Garden of forking paths.** Many rule variants were tried on the same regression set. Keep a log of how many variants were tried. Treat a variant as adopted only if it (a) wins on the tuning set by more than the paired-bootstrap CI and (b) does not lose on the frozen hold-out. The current project rule ("what makes things worse stays off") guards only one side. Without (b), small wins accumulate as selection noise.
- **Rough sample sizes.** To detect a 5 pp paired improvement where about 15 % of cuts change outcome, about 100–150 cuts are needed. A 2 pp effect needs several hundred. Below about 40 cuts per city, report only descriptive results. This is a rough rule of thumb from my own binomial arithmetic, not from a source.

### Gaps
- I found no source giving formal minimum sample sizes for profile or boundary benchmarks.
- I did not open Benjamini–Hochberg or a block-bootstrap reference directly. Field & Welsh was seen at abstract level only.

## 3. Metrics for cross-section and composition comparison, robust to imperfect ground truth

### Takeaway
Report a set of metrics, not a single number:
1. The distribution of signed boundary errors per boundary type (median, IQR, share within 0.3, 0.5 and 1 m).
2. A per-metre class confusion matrix along the 1-D profile, with per-class IoU and per-class agreement (user's and producer's accuracy).
3. Composition-level agreement: presence or absence of each element and its order.

Rankings depend on the metric chosen. Reference data have errors of their own (MTVU missing parking), so parking-related classes need either a mask or a separate truth.

### Cited Findings
- **Per-image scores and boundary measures (abstract only).** Per-image scores give more insight than a dataset-wide score. Boundaries deserve a contour-based F1 measure. The ranking of methods depends heavily on the measure, and different algorithms are optimal under different measures. — [Csurka, Larlus & Perronnin 2013, BMVC](https://bmva-archive.org.uk/bmvc/2013/Papers/paper0032/index.html)
- **Boundary F1 with tolerance (search snippet only).** The boundary F1 counts a boundary point as matched if it lies within a distance tolerance of the other boundary, and computes precision and recall over these matches. MATLAB's default tolerance is 0.75 % of the image diagonal. — [MathWorks bfscore](https://au.mathworks.com/help/images/ref/bfscore.html)
- **Metrics that capture what matters for the use case (search snippet only).** SpaceNet's APLS compares shortest-path lengths between the proposed and true road graphs. It penalises broken connectivity, which pixel IoU misses. — [SpaceNet paper](https://arxiv.org/pdf/1807.01232); [Van Etten blog](https://medium.com/the-downlinq/spacenet-road-detection-and-routing-challenge-part-i-d4f59d55bfce)
- **Wrong labels in test sets (abstract only).** At least 3.3 % of test labels across 10 benchmarks are wrong, and at least 6 % in the ImageNet validation set. A moderate rise in mislabelled examples (about 6 % on ImageNet) flips ResNet-18 above ResNet-50. Noisy test labels can change which model is chosen. — [Northcutt et al. 2021](https://arxiv.org/abs/2103.14749)
- **Classical accuracy assessment (abstract only).** Stehman & Foody structure rigorous assessment into sampling design, response design (how the reference label is obtained) and analysis. They stress probability sampling, error matrices and documented uncertainty. They warn that weak assessments "offer a veneer of scientific respectability". — [Stehman & Foody 2019, RSE 231:111199](https://nottingham-repository.worktribe.com/output/2306994)

### Inferences
- **The 1-D analogue of segmentation metrics.**
  - Sample both profiles every 0.1 m from façade to façade.
  - Build a confusion matrix of predicted against true class: carriageway, sidewalk, green, parking, tram, cycle, other.
  - Report per-class IoU (length of the intersection over length of the union), overall agreement, and per-class producer's and user's accuracy.
  - This directly operationalises the "composition first" priority.
- **Boundary metrics.**
  - Match each true boundary to the nearest predicted boundary of the same type (kerb, sidewalk edge) and record the signed error and its absolute value.
  - Report the empirical CDF, not only one tolerance, because "within 1 m" thresholds hide shifts.
  - Signed errors reveal systematic bias, for example sidewalks that are consistently too wide in the Cottbus front-garden case.
- **Imperfect truth (MTVU without parking).**
  - (a) Merge parking with carriageway when scoring against MTVU, so the score measures the kerb-to-kerb outline.
  - (b) Score parking only on a subset with independent truth: street photos (the universal Mapillary method already used), TSK parking segments in Prague, or the parkovanivbrne.cz map in Brno.
  - (c) Flag cuts where truth is known to be incomplete and report them separately.
  - Never tune parking rules against MTVU, because that would optimise toward the truth's omission.
- **Error in passports.** City passports (Slovakia) are a different, possibly lower-quality response design. Keep their results separate from MTVU and FMZK results rather than pooling them.

### Gaps
- I found no published metric designed specifically for 1-D street profiles. The per-metre confusion and IoU above is an adaptation.
- I did not verify Csurka's exact tolerance definition or the full Stehman & Foody text, because of access limits.

## 4. How road-extraction and mapping benchmarks evaluate across cities, seasons and sensors

### Takeaway
Major remote-sensing benchmarks treat geographic or domain transfer as a separate test condition: multiple cities, urban versus rural domains, unsupervised domain adaptation. Our setting (new cities, new orthophoto providers) should follow the same practice: report in-domain and out-of-domain numbers separately.

### Cited Findings
- **LoveDA (abstract only).** 5,987 images and 166,768 annotated objects from three cities (Nanjing, Changzhou, Wuhan) and 18 scenes. The data are split into urban and rural domains, explicitly to test transferability. Eleven segmentation and eight UDA methods are benchmarked. The authors note that earlier land-cover datasets "ignored model transferability". — [Wang et al. 2021, NeurIPS D&B](https://arxiv.org/abs/2110.08733)
- **City-scale road extraction (abstract only).** Results are reported on a 608 km² test area covering four cities: APLS 0.73, TOPO 0.58. The abstract does not say whether the test cities were excluded from training. — [Van Etten 2019](https://arxiv.org/abs/1904.09901)
- **SpaceNet (search snippet only).** The challenges cover multiple cities and use the APLS metric. — [SpaceNet dataset paper](https://arxiv.org/pdf/1807.01232)

### Inferences
- **Three-way table.** Present the AI kerb model and the rules as:
  - in-training-city (Prague, Vienna, Berlin, Hamburg tiles not used in training)
  - seen-for-selection (Brno)
  - unseen city
  - The same split applies to orthophoto source (IPR 10 cm, ČÚZK 12.5 cm, basemap.at 30 cm, Länder WMS) and season or year, since these act as sensor domains.
- **Stratify by orthophoto.** Report results per orthophoto provider. The existing Brno 2025 and Brno ČÚZK split is already a good example of a sensor-domain comparison.

### Gaps
- I did not obtain LoveDA's per-domain mIoU drops or the per-city split protocols of SpaceNet or DeepGlobe; only abstracts were accessible. Searches for cross-city road-extraction generalisation numbers were not completed within the tool budget.

## Concrete recommendations for our setup (synthesis)
1. **Split into three sets.**
   - (a) A tuning set: the current 87 + 94 + 43 cuts. Accept that its numbers are optimistic and label them "tuning".
   - (b) A frozen hold-out: new random cuts, stratified by road class, about 100 in Prague and Brno plus about 40 per other city, never inspected while tuning.
   - (c) Leave-one-city-out for transfer claims.
   - (Cawley & Talbot; Roberts et al.)
2. **AI model.** Fix the seed and epoch rule using only the training cities' validation tiles, or average 3–5 seeds. Re-report Brno as validation and choose a clean test city. (Cawley & Talbot; Bouthillier et al.)
3. **Paired testing.** For every variant, report discordant counts (better/worse), a sign-test p-value and a street-level paired-bootstrap 95 % CI of the difference. Adopt only if the CI excludes 0 on tuning and the hold-out does not get worse. (Dror et al.; Bouthillier et al.; Field & Welsh)
4. **Multiplicity.** Log the number of variants tried. With many variants, either apply Bonferroni or Holm to the tuning-set tests or rely on hold-out confirmation. Replicability across cities (most cities improve) is a natural K-Bonferroni-style criterion. (Dror et al.)
5. **Metrics.** Use per-metre class confusion, per-class IoU and agreement, a signed boundary-error CDF per boundary type, and composition presence and order. Report per city and per orthophoto source, not only pooled. (Csurka et al.; Meyer & Pebesma)
6. **Imperfect truth.** Merge or mask parking when scoring against MTVU. Score parking only against independent truth (street photos, TSK/Golemio parking segments). Keep passport truth separate. (Northcutt et al.; Stehman & Foody)
