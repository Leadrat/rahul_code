# India Census & Housing Deep-dive

## Overview

The analysis integrates district-level census indicators with the high-resolution housing stock dataset,
unlocking joined-up views of socio-economic and dwelling characteristics across India.

* District dataset: 640 rows × 118 columns
* Housing dataset: 1,908 rows × 156 columns

## Key state-level insights

**State comparisons** (top 10 unless noted):

| State name     |   Population |
|:---------------|-------------:|
| UTTAR PRADESH  |    199812341 |
| MAHARASHTRA    |    112374333 |
| BIHAR          |    104099452 |
| WEST BENGAL    |     91276115 |
| ANDHRA PRADESH |     84580777 |
| MADHYA PRADESH |     72626809 |
| TAMIL NADU     |     72147030 |
| RAJASTHAN      |     68548437 |
| KARNATAKA      |     61095297 |
| GUJARAT        |     60439692 |

Top literacy leaders:
| State name                  |   Value |
|:----------------------------|--------:|
| KERALA                      |   84.22 |
| LAKSHADWEEP                 |   81.51 |
| GOA                         |   79.91 |
| DAMAN AND DIU               |   77.45 |
| ANDAMAN AND NICOBAR ISLANDS |   77.32 |
| MIZORAM                     |   77.3  |
| PONDICHERRY                 |   76.71 |
| TRIPURA                     |   76.34 |
| CHANDIGARH                  |   76.31 |
| NCT OF DELHI                |   75.87 |

Highest internet penetration:
| State name   |   Value |
|:-------------|--------:|
| CHANDIGARH   |   14.84 |
| NCT OF DELHI |   12.79 |
| GOA          |    7.12 |
| PONDICHERRY  |    4.66 |
| KERALA       |    4.31 |
| MAHARASHTRA  |    4.11 |
| PUNJAB       |    3.72 |
| KARNATAKA    |    3.55 |
| HARYANA      |    3.5  |
| TAMIL NADU   |    3.33 |

Lowest sanitation gap (higher values imply better in-premise latrine coverage):
| State name   |   Value |
|:-------------|--------:|
| MIZORAM      |   24.59 |
| MANIPUR      |   25.76 |
| CHANDIGARH   |   30.95 |
| TRIPURA      |   32.04 |
| SIKKIM       |   33.89 |
| KERALA       |   34.52 |
| NCT OF DELHI |   35.06 |
| NAGALAND     |   42.73 |
| PUNJAB       |   45.34 |
| PONDICHERRY  |   46.85 |

## Housing fabric & amenities

Average composition across all housing records:
|                        |     0 |
|:-----------------------|------:|
| Material_Roof_Concrete | 26.92 |
| Material_Roof_MUB      | 22.1  |
| Material_Roof_GMAS     | 21.02 |
| Material_Roof_GTBW     | 14.5  |
| Material_Roof_HMT      | 13.43 |
| Material_Roof_GTB      | 10.88 |
| Material_Roof_SS       |  9.4  |
| Material_Roof_MMT      |  7.39 |
| Material_Roof_BB       |  6.29 |
| Material_Roof_Wood     |  2.14 |

Most prevalent wall materials:
|                        |     0 |
|:-----------------------|------:|
| Material_Wall_Bb       | 45.8  |
| Material_Wall_SPWM     |  9.87 |
| Material_Wall_SNPWM    |  3.76 |
| Material_Wall_Concrete |  3.21 |
| Material_Wall_GIMAS    |  1.1  |
| Material_Wall_AOM      |  0.75 |

Cooking fuel mix highlights:
|                  |     0 |
|:-----------------|------:|
| Cooking_IH       | 89.72 |
| Cooking_FW       | 50.3  |
| Cooking_LPG_PNG  | 32.04 |
| Cooking_OH       |  9.96 |
| Cooking_CC       |  6.44 |
| Cooking_CR       |  6.06 |
| Cooking_kerosene |  2.46 |
| Cooking_CLC      |  1.55 |
| Cooking_Biogas   |  0.37 |
| Cooking_NC       |  0.33 |

## Exploratory question bank (30 prompts)

Curated prompts you can pose to the analytical notebook or model interface.
|    | Question                                                                                   | Output               | Description                                                                                   |
|---:|:-------------------------------------------------------------------------------------------|:---------------------|:----------------------------------------------------------------------------------------------|
|  0 | Which states contribute the highest share of India's total population?                     | Table                | Rank states by population using aggregated district totals.                                   |
|  1 | How does literacy rate correlate with worker participation at the district level?          | Scatter plot         | Plot literacy percentage against worker participation rate with an urbanisation colour scale. |
|  2 | What is the distribution of roof materials across rural housing stock?                     | Bar chart            | Summarise the mean share of roof material categories (rural subset).                          |
|  3 | Which districts face the largest sanitation gaps (lack of in-premise latrines)?            | Table                | Sort districts by sanitation gap metric derived from latrine coverage.                        |
|  4 | How is internet access spread across states when normalised by total households?           | Bar chart            | Compute household-weighted internet penetration per state.                                    |
|  5 | Which cooking fuels dominate urban households compared to rural ones?                      | Grouped bar chart    | Contrast mean cooking fuel shares split by Rural/Urban flag.                                  |
|  6 | How does asset ownership (TV, mobile, internet, vehicle) vary by state?                    | Stacked bar chart    | Aggregate asset ownership percentages per state and display comparisons.                      |
|  7 | Which districts have the highest female-to-male sex ratio?                                 | Table                | List top districts by computed sex ratio indicator.                                           |
|  8 | Where is the gap between rural and urban literacy widest?                                  | Bar chart            | Calculate literacy difference between rural and urban households per district/state.          |
|  9 | What share of households live in dilapidated dwellings across states?                      | Heatmap              | Summarise dilapidated household percentage by Rural/Urban and state.                          |
| 10 | Which districts report the highest proportion of households using LPG/PNG for cooking?     | Table                | Rank districts by LPG/PNG adoption using housing dataset percentages.                         |
| 11 | How does internet access relate to literacy at the state level?                            | Scatter plot         | Plot state-level literacy versus internet penetration with bubble size for population.        |
| 12 | Which states have the largest marginal worker populations?                                 | Bar chart            | Sum marginal workers per state from district census data.                                     |
| 13 | How prevalent are non-permanent wall materials across districts?                           | Choropleth map       | Map percentage of non-brick/concrete wall materials to highlight vulnerability.               |
| 14 | What percentage of households access drinking water within premises versus away?           | Stacked bar chart    | Aggregate water-source proximity categories by state.                                         |
| 15 | Which districts have the highest concentration of Scheduled Tribe populations?             | Table                | Rank districts by share of ST population in total population.                                 |
| 16 | How does rural electrification compare with urban electrification by state?                | Dual line chart      | Track electricity access percentages for rural vs urban households per state.                 |
| 17 | Where are machine-made tiles most prevalent as roof material?                              | Table                | Identify top regions by mean share of machine-made tiles in housing records.                  |
| 18 | Which states demonstrate the highest female literacy rates?                                | Bar chart            | Calculate female literacy share relative to female population per state.                      |
| 19 | How does household size distribution vary between rural and urban areas?                   | Violin plot          | Visualise household size categories split by Rural/Urban flag.                                |
| 20 | What is the relationship between tele-density and internet adoption?                       | Scatter plot         | Plot mobile phone access against internet penetration at state level.                         |
| 21 | Which districts rely heavily on kerosene or other traditional fuels for cooking?           | Table                | Highlight districts where non-clean fuels exceed a chosen threshold.                          |
| 22 | How many households lack bathing facilities within premises across states?                 | Horizontal bar chart | Aggregate counts of households without bathing facility and normalise by totals.              |
| 23 | Where is the urbanisation rate growing fastest relative to household counts?               | Line chart           | Trend urban household ratios when multi-year data becomes available (placeholder for future). |
| 24 | Which districts exhibit the highest percentage of graduate-educated residents?             | Table                | Rank districts by share of graduate-level education among literate population.                |
| 25 | How does household asset ownership cluster together?                                       | Clustered heatmap    | Perform hierarchical clustering on asset access percentages per state.                        |
| 26 | What is the distribution of households by dwelling condition (good, livable, dilapidated)? | Pie chart            | Visualise overall share of dwelling conditions across India.                                  |
| 27 | Which states have the lowest workforce participation among women?                          | Bar chart            | Compute female worker participation as share of female population per state.                  |
| 28 | How do separate kitchen facilities vary with fuel types?                                   | Mosaic plot          | Cross-tabulate kitchen availability with primary cooking fuel categories.                     |
| 29 | Where is the reliance on hand pumps for drinking water highest?                            | Table                | Identify districts with the greatest share of hand-pump usage in water sources.               |
| 30 | Which districts show the highest proportion of alternative latrine arrangements?           | Table                | Rank based on alternative latrine facility usage (e.g., pit, service, open drain).            |

## Data quality notes

No missing values detected in the supplied datasets.

## Figure index

Generated visualisations:
* Top states by total population: top_states_population.png
* Literacy vs workforce participation: literacy_vs_workforce.png
* Most common roof materials: roof_material_mix.png
* Average household access to key assets: household_asset_access.png
