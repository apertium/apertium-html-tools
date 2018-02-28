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
| cat  | 100% | 112.49% |
| mar  | 100% | 101.36% |
| eng  | 100% | 100.00% |
| fin  | 100% | 95.51% |
| deu  | 91% | 104.58% |
| kir  | 89% | 45.64% |
| srd  | 85% | 91.69% |
| arg  | 83% | 94.39% |
| uzb  | 83% | 92.09% |
| swe  | 83% | 86.55% |
| tur  | 83% | 86.46% |
| rus  | 83% | 82.28% |
| nob  | 81% | 85.66% |
| nno  | 81% | 81.28% |
| kaa  | 79% | 87.73% |
| tha  | 79% | 75.80% |
| spa  | 74% | 26.94% |
| fra  | 70% | 86.97% |
| oci  | 70% | 83.91% |
| uig  | 70% | 78.71% |
| kaz  | 70% | 77.99% |
| heb  | 70% | 69.26% |
| sme  | 58% | 14.75% |
| tat  | 58% | 12.15% |
| por  | 50% | 12.35% |
| eus  | 47% | 13.16% |
| ava  | 45% | 12.51% |
| zho  | 45% | 3.89% |
| ron  | 41% | 9.05% |

\*CBE: completion by entries<br>
\**CBC: completion by characters (i.e., ratio of characters to English ~source)
