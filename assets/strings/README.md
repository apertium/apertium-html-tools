Localization
============

This directory contains the JSON files powering Html-tools' localization as well as some helpful utilities. `locales.json` contains a reference to each JSON strings file as well as each language's endonym. Localization instructions are available on the [Apertium Wiki](http://wiki.apertium.org/wiki/Apertium-html-tools).

After editing localizations, do the following or tell another developer:

```bash
$ ./cleanup.sh
$ echo "$( sed -n '/<!--table-->$/q;p' README.md ; echo '<!--table-->' ; ./progresstable.sh md ; )" > README.md
```

<!--table-->
| code | CBE* | CBC** |
|------|------|-------|
| deu  | 100% | 114.30% |
| cat  | 100% | 112.49% |
| arg  | 100% | 111.82% |
| tat  | 100% | 105.34% |
| mar  | 100% | 101.36% |
| eng  | 100% | 100.00% |
| fin  | 100% | 95.51% |
| kir  | 89% | 45.64% |
| fra  | 87% | 93.72% |
| srd  | 85% | 91.69% |
| uzb  | 83% | 92.09% |
| swe  | 83% | 86.55% |
| tur  | 83% | 86.46% |
| rus  | 83% | 82.55% |
| nob  | 81% | 85.66% |
| nno  | 81% | 81.28% |
| kaa  | 79% | 87.73% |
| tha  | 79% | 75.80% |
| spa  | 74% | 26.94% |
| oci  | 70% | 83.91% |
| uig  | 70% | 78.71% |
| kaz  | 70% | 77.99% |
| heb  | 70% | 69.26% |
| sme  | 58% | 14.75% |
| por  | 50% | 12.35% |
| eus  | 47% | 13.16% |
| ava  | 45% | 12.51% |
| zho  | 45% | 3.89% |
| ron  | 41% | 9.05% |

\*CBE: completion by entries<br>
\**CBC: completion by characters (i.e., ratio of characters to English ~source)

