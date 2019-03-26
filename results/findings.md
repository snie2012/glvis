# 1.png
`Observation:` One set of dimensions is good at picking out the MISC class, while another set of dimensions is good at picking out the PER class.
`Hypothesis:` While there are more than two classes, the class information can be distributed unevenly. Some dimensions are used to predict one class, which other different dimensions are used to predict another class. 

# 2.png
`Observation:` A single dimension can differentiate two classes as good as many dimensions combined. 
`Hypothesis`: This might mean that some dimensions can be meaningful to capture distict features between classes, although most of the information is distributed.

# 3.png
This leads to the hypothesis that similar prediction accuracy might be achievable through a subset of dimensions. This opens opportunities for model compression and reduction.

===========================================================
* A subset of dimensions still contains enough information to tell one class from another.

* A subset of dimensions contain information for all classes, not just one class.

* Some subset of dimensions might contain more information about one class over another.