"""India census housing data exploratory analysis script.

This module loads the three provided CSV datasets, engineers additional
metrics, produces a handful of illustrative visualisations, and exports a
concise Markdown report summarising the findings. Run it from the project
root (after installing dependencies) with:

    python src/data_analysis.py --data-dir . --output-dir reports

Both ``--data-dir`` and ``--output-dir`` are optional and default to the
project root and ``reports/`` respectively.
"""
from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, Iterable, List, Tuple

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns

sns.set_theme(style="whitegrid")


@dataclass
class DatasetBundle:
    """Container for the three core datasets used in the analysis."""

    district: pd.DataFrame
    housing: pd.DataFrame
    colmap: Dict[str, str]


def load_hlpca_mapping(mapping_path: Path) -> Dict[str, str]:
    """Load the column code to description mapping used by the housing dataset."""

    mapping: Dict[str, str] = {}
    with mapping_path.open("r", encoding="utf-8") as fh:
        for raw_line in fh:
            line = raw_line.strip()
            if not line:
                continue
            key, sep, value = line.partition(",")
            if not sep:
                continue  # skip malformed lines without a comma
            mapping[key.strip()] = value.strip()
    return mapping


def load_datasets(data_dir: Path) -> DatasetBundle:
    """Load all CSV artefacts into memory."""

    district_path = data_dir / "india-districts-census-2011.csv"
    housing_path = data_dir / "india_census_housing-hlpca-full.csv"
    mapping_path = data_dir / "hlpca-colnames.csv"

    if not district_path.exists() or not housing_path.exists() or not mapping_path.exists():
        missing = [path.name for path in (district_path, housing_path, mapping_path) if not path.exists()]
        raise FileNotFoundError(f"Missing required input files: {', '.join(missing)}")

    district_df = pd.read_csv(district_path)
    housing_df = pd.read_csv(housing_path)
    colmap = load_hlpca_mapping(mapping_path)

    renamed_columns = {col: colmap[col] for col in housing_df.columns if col in colmap}
    housing_df = housing_df.rename(columns=renamed_columns)

    return DatasetBundle(district=district_df, housing=housing_df, colmap=colmap)


def summarise_dataframe(df: pd.DataFrame) -> Dict[str, object]:
    """Generate high-level metadata about a dataframe."""

    summary = {
        "rows": int(df.shape[0]),
        "columns": int(df.shape[1]),
        "duplicate_rows": int(df.duplicated().sum()),
    }
    missing = df.isna().sum()
    summary["missing_values"] = missing[missing > 0].sort_values(ascending=False)
    return summary


def compute_district_metrics(district_df: pd.DataFrame) -> pd.DataFrame:
    """Augment the district dataset with derived indicators."""

    df = district_df.copy()

    with np.errstate(divide="ignore", invalid="ignore"):
        df["Sex_Ratio"] = (df["Female"] / df["Male"]) * 1000
        df["Literacy_Rate"] = (df["Literate"] / df["Population"]) * 100
        df["Worker_Participation_Rate"] = (df["Workers"] / df["Population"]) * 100
        df["Urbanisation_Rate"] = (df["Urban_Households"] / df["Households"]) * 100
        df["Internet_Penetration"] = (df["Households_with_Internet"] / df["Households"]) * 100
        df["Mobile_Phone_Access"] = (df["Households_with_Telephone_Mobile_Phone"] / df["Households"]) * 100
        df["Sanitation_Gap"] = 100 - (df["Having_latrine_facility_within_the_premises_Total_Households"] / df["Households"] * 100)

    return df


def select_numeric_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Return numeric subset for statistical profiling."""

    numeric_df = df.select_dtypes(include=[np.number])
    return numeric_df


def compute_state_level_insights(district_df: pd.DataFrame) -> Dict[str, pd.Series]:
    """Aggregate district metrics to state level for comparison."""

    grouped = district_df.groupby("State name", dropna=False)

    sums = grouped[[
        "Population",
        "Literate",
        "Households",
        "Households_with_Internet",
        "Having_latrine_facility_within_the_premises_Total_Households",
    ]].sum()

    pop_by_state = sums["Population"].sort_values(ascending=False)

    literacy_by_state = (sums["Literate"] / sums["Population"] * 100).sort_values(ascending=False)

    internet_by_state = (sums["Households_with_Internet"] / sums["Households"] * 100).sort_values(ascending=False)

    sanitation_gap = (100 - (sums["Having_latrine_facility_within_the_premises_Total_Households"] /
                             sums["Households"] * 100)).sort_values()

    return {
        "population": pop_by_state,
        "literacy_rate": literacy_by_state,
        "internet_penetration": internet_by_state,
        "sanitation_gap": sanitation_gap,
    }


def compute_housing_highlights(housing_df: pd.DataFrame) -> Dict[str, pd.Series]:
    """Summarise notable distributions from the housing dataset."""

    roof_columns = [col for col in housing_df.columns if col.lower().startswith("material_roof")]
    wall_columns = [col for col in housing_df.columns if col.lower().startswith("material_wall")]
    cooking_columns = [col for col in housing_df.columns if col.lower().startswith("cooking_")]

    roof_mix = housing_df[roof_columns].mean().sort_values(ascending=False)
    wall_mix = housing_df[wall_columns].mean().sort_values(ascending=False)
    cooking_mix = housing_df[cooking_columns].mean().sort_values(ascending=False)

    return {
        "roof_mix": roof_mix,
        "wall_mix": wall_mix,
        "cooking_mix": cooking_mix,
    }


def save_series_table(series: pd.Series, top_n: int = 10) -> pd.DataFrame:
    """Convert a series into a tidy dataframe for reporting."""

    return series.head(top_n).round(2).reset_index().rename(columns={"index": "Category", 0: "Value"})


def build_question_bank() -> pd.DataFrame:
    """Craft a catalogue of analytical questions and expected outputs."""

    questions: List[Dict[str, str]] = [
        {
            "Question": "Which states contribute the highest share of India's total population?",
            "Output": "Table",
            "Description": "Rank states by population using aggregated district totals.",
        },
        {
            "Question": "How does literacy rate correlate with worker participation at the district level?",
            "Output": "Scatter plot",
            "Description": "Plot literacy percentage against worker participation rate with an urbanisation colour scale.",
        },
        {
            "Question": "What is the distribution of roof materials across rural housing stock?",
            "Output": "Bar chart",
            "Description": "Summarise the mean share of roof material categories (rural subset).",
        },
        {
            "Question": "Which districts face the largest sanitation gaps (lack of in-premise latrines)?",
            "Output": "Table",
            "Description": "Sort districts by sanitation gap metric derived from latrine coverage.",
        },
        {
            "Question": "How is internet access spread across states when normalised by total households?",
            "Output": "Bar chart",
            "Description": "Compute household-weighted internet penetration per state.",
        },
        {
            "Question": "Which cooking fuels dominate urban households compared to rural ones?",
            "Output": "Grouped bar chart",
            "Description": "Contrast mean cooking fuel shares split by Rural/Urban flag.",
        },
        {
            "Question": "How does asset ownership (TV, mobile, internet, vehicle) vary by state?",
            "Output": "Stacked bar chart",
            "Description": "Aggregate asset ownership percentages per state and display comparisons.",
        },
        {
            "Question": "Which districts have the highest female-to-male sex ratio?",
            "Output": "Table",
            "Description": "List top districts by computed sex ratio indicator.",
        },
        {
            "Question": "Where is the gap between rural and urban literacy widest?",
            "Output": "Bar chart",
            "Description": "Calculate literacy difference between rural and urban households per district/state.",
        },
        {
            "Question": "What share of households live in dilapidated dwellings across states?",
            "Output": "Heatmap",
            "Description": "Summarise dilapidated household percentage by Rural/Urban and state.",
        },
        {
            "Question": "Which districts report the highest proportion of households using LPG/PNG for cooking?",
            "Output": "Table",
            "Description": "Rank districts by LPG/PNG adoption using housing dataset percentages.",
        },
        {
            "Question": "How does internet access relate to literacy at the state level?",
            "Output": "Scatter plot",
            "Description": "Plot state-level literacy versus internet penetration with bubble size for population.",
        },
        {
            "Question": "Which states have the largest marginal worker populations?",
            "Output": "Bar chart",
            "Description": "Sum marginal workers per state from district census data.",
        },
        {
            "Question": "How prevalent are non-permanent wall materials across districts?",
            "Output": "Choropleth map",
            "Description": "Map percentage of non-brick/concrete wall materials to highlight vulnerability.",
        },
        {
            "Question": "What percentage of households access drinking water within premises versus away?",
            "Output": "Stacked bar chart",
            "Description": "Aggregate water-source proximity categories by state.",
        },
        {
            "Question": "Which districts have the highest concentration of Scheduled Tribe populations?",
            "Output": "Table",
            "Description": "Rank districts by share of ST population in total population.",
        },
        {
            "Question": "How does rural electrification compare with urban electrification by state?",
            "Output": "Dual line chart",
            "Description": "Track electricity access percentages for rural vs urban households per state.",
        },
        {
            "Question": "Where are machine-made tiles most prevalent as roof material?",
            "Output": "Table",
            "Description": "Identify top regions by mean share of machine-made tiles in housing records.",
        },
        {
            "Question": "Which states demonstrate the highest female literacy rates?",
            "Output": "Bar chart",
            "Description": "Calculate female literacy share relative to female population per state.",
        },
        {
            "Question": "How does household size distribution vary between rural and urban areas?",
            "Output": "Violin plot",
            "Description": "Visualise household size categories split by Rural/Urban flag.",
        },
        {
            "Question": "What is the relationship between tele-density and internet adoption?",
            "Output": "Scatter plot",
            "Description": "Plot mobile phone access against internet penetration at state level.",
        },
        {
            "Question": "Which districts rely heavily on kerosene or other traditional fuels for cooking?",
            "Output": "Table",
            "Description": "Highlight districts where non-clean fuels exceed a chosen threshold.",
        },
        {
            "Question": "How many households lack bathing facilities within premises across states?",
            "Output": "Horizontal bar chart",
            "Description": "Aggregate counts of households without bathing facility and normalise by totals.",
        },
        {
            "Question": "Where is the urbanisation rate growing fastest relative to household counts?",
            "Output": "Line chart",
            "Description": "Trend urban household ratios when multi-year data becomes available (placeholder for future).",
        },
        {
            "Question": "Which districts exhibit the highest percentage of graduate-educated residents?",
            "Output": "Table",
            "Description": "Rank districts by share of graduate-level education among literate population.",
        },
        {
            "Question": "How does household asset ownership cluster together?",
            "Output": "Clustered heatmap",
            "Description": "Perform hierarchical clustering on asset access percentages per state.",
        },
        {
            "Question": "What is the distribution of households by dwelling condition (good, livable, dilapidated)?",
            "Output": "Pie chart",
            "Description": "Visualise overall share of dwelling conditions across India.",
        },
        {
            "Question": "Which states have the lowest workforce participation among women?",
            "Output": "Bar chart",
            "Description": "Compute female worker participation as share of female population per state.",
        },
        {
            "Question": "How do separate kitchen facilities vary with fuel types?",
            "Output": "Mosaic plot",
            "Description": "Cross-tabulate kitchen availability with primary cooking fuel categories.",
        },
        {
            "Question": "Where is the reliance on hand pumps for drinking water highest?",
            "Output": "Table",
            "Description": "Identify districts with the greatest share of hand-pump usage in water sources.",
        },
        {
            "Question": "Which districts show the highest proportion of alternative latrine arrangements?",
            "Output": "Table",
            "Description": "Rank based on alternative latrine facility usage (e.g., pit, service, open drain).",
        },
    ]

    return pd.DataFrame(questions)


def create_output_dir(output_dir: Path) -> Path:
    """Ensure the destination directory exists."""

    output_dir.mkdir(parents=True, exist_ok=True)
    return output_dir


def plot_top_states_by_population(pop_series: pd.Series, output_dir: Path) -> Path:
    plt.figure(figsize=(10, 6))
    top = pop_series.head(10)[::-1]
    sns.barplot(x=top.values / 1_000_000, y=top.index, palette="crest")
    plt.xlabel("Population (millions)")
    plt.ylabel("State")
    plt.title("Top 10 States by Total Population")
    output_path = output_dir / "top_states_population.png"
    plt.tight_layout()
    plt.savefig(output_path, dpi=150)
    plt.close()
    return output_path


def plot_literacy_vs_workers(district_df: pd.DataFrame, output_dir: Path) -> Path:
    plt.figure(figsize=(8, 6))
    sns.scatterplot(
        data=district_df,
        x="Literacy_Rate",
        y="Worker_Participation_Rate",
        hue="Urbanisation_Rate",
        palette="viridis",
        alpha=0.6,
    )
    plt.xlabel("Literacy rate (%)")
    plt.ylabel("Worker participation rate (%)")
    plt.title("District-level literacy vs. workforce participation")
    plt.legend(title="Urbanisation (%)", loc="lower right", frameon=True)
    output_path = output_dir / "literacy_vs_workforce.png"
    plt.tight_layout()
    plt.savefig(output_path, dpi=150)
    plt.close()
    return output_path


def plot_roof_material_mix(roof_mix: pd.Series, output_dir: Path) -> Path:
    plt.figure(figsize=(9, 5))
    top = roof_mix.head(8)
    sns.barplot(x=top.values, y=top.index, palette="flare")
    plt.xlabel("Average share across records (%)")
    plt.ylabel("Roof material")
    plt.title("Most common roof materials")
    output_path = output_dir / "roof_material_mix.png"
    plt.tight_layout()
    plt.savefig(output_path, dpi=150)
    plt.close()
    return output_path


def plot_asset_access(district_df: pd.DataFrame, output_dir: Path) -> Path:
    asset_cols = {
        "Television": "Households_with_Television",
        "Mobile phone": "Households_with_Telephone_Mobile_Phone",
        "Internet": "Households_with_Internet",
        "Car / Jeep / Van": "Households_with_Car_Jeep_Van",
    }
    aggregated = district_df.groupby("State name").agg({col: "sum" for col in asset_cols.values()})
    aggregated["Households"] = district_df.groupby("State name")["Households"].sum()
    for label, col in asset_cols.items():
        aggregated[label] = aggregated[col] / aggregated["Households"] * 100
    share_df = aggregated[["Television", "Mobile phone", "Internet", "Car / Jeep / Van"]].mean().sort_values(ascending=False)

    plt.figure(figsize=(8, 5))
    sns.barplot(x=share_df.values, y=share_df.index, palette="magma")
    plt.xlabel("Average state-level household access (%)")
    plt.ylabel("Asset")
    plt.title("Average household access to key assets")
    output_path = output_dir / "household_asset_access.png"
    plt.tight_layout()
    plt.savefig(output_path, dpi=150)
    plt.close()
    return output_path


def build_markdown_section(title: str, body: Iterable[str]) -> List[str]:
    lines = [f"## {title}", ""]
    lines.extend(body)
    lines.append("")
    return lines


def generate_markdown_report(
    bundle: DatasetBundle,
    district_enriched: pd.DataFrame,
    state_insights: Dict[str, pd.Series],
    housing_highlights: Dict[str, pd.Series],
    plots: List[Tuple[str, Path]],
    output_path: Path,
) -> Path:
    """Persist a Markdown summary of the analysis."""

    lines: List[str] = ["# India Census & Housing Deep-dive", ""]

    district_summary = summarise_dataframe(bundle.district)
    housing_summary = summarise_dataframe(bundle.housing)

    overview_lines = [
        "The analysis integrates district-level census indicators with the high-resolution housing stock dataset,",
        "unlocking joined-up views of socio-economic and dwelling characteristics across India.",
        "",
        f"* District dataset: {district_summary['rows']:,} rows × {district_summary['columns']} columns",
        f"* Housing dataset: {housing_summary['rows']:,} rows × {housing_summary['columns']} columns",
    ]
    lines.extend(build_markdown_section("Overview", overview_lines))

    top_population = save_series_table(state_insights["population"], top_n=10)
    top_literacy = save_series_table(state_insights["literacy_rate"], top_n=10)
    lowest_sanitation_gap = save_series_table(state_insights["sanitation_gap"].head(10))
    top_internet = save_series_table(state_insights["internet_penetration"], top_n=10)

    insight_lines = [
        "**State comparisons** (top 10 unless noted):",
        "",
        top_population.to_markdown(index=False),
        "",
        "Top literacy leaders:",
        top_literacy.to_markdown(index=False),
        "",
        "Highest internet penetration:",
        top_internet.to_markdown(index=False),
        "",
        "Lowest sanitation gap (higher values imply better in-premise latrine coverage):",
        lowest_sanitation_gap.to_markdown(index=False),
    ]
    lines.extend(build_markdown_section("Key state-level insights", insight_lines))

    roof_lines = ["Average composition across all housing records:", housing_highlights["roof_mix"].head(10).round(2).to_markdown()]  # type: ignore[arg-type]
    wall_lines = ["Most prevalent wall materials:", housing_highlights["wall_mix"].head(10).round(2).to_markdown()]  # type: ignore[arg-type]
    cooking_lines = ["Cooking fuel mix highlights:", housing_highlights["cooking_mix"].head(10).round(2).to_markdown()]  # type: ignore[arg-type]

    lines.extend(build_markdown_section("Housing fabric & amenities", roof_lines + [""] + wall_lines + [""] + cooking_lines))

    question_bank = build_question_bank()
    question_lines = [
        "Curated prompts you can pose to the analytical notebook or model interface.",
        question_bank.to_markdown(index=True),
    ]
    lines.extend(build_markdown_section("Exploratory question bank (30 prompts)", question_lines))

    if district_summary["missing_values"].empty and housing_summary["missing_values"].empty:
        data_quality_lines = ["No missing values detected in the supplied datasets."]
    else:
        dq_content = ["Columns with missing values (non-zero only):"]
        if not district_summary["missing_values"].empty:
            dq_content.append("District dataset:")
            dq_content.append(district_summary["missing_values"].to_markdown())
        if not housing_summary["missing_values"].empty:
            dq_content.append("Housing dataset:")
            dq_content.append(housing_summary["missing_values"].to_markdown())
        data_quality_lines = dq_content
    lines.extend(build_markdown_section("Data quality notes", data_quality_lines))

    if plots:
        plot_lines = ["Generated visualisations:"]
        plot_lines.extend([f"* {title}: {path.name}" for title, path in plots])
        lines.extend(build_markdown_section("Figure index", plot_lines))

    output_path.write_text("\n".join(lines), encoding="utf-8")
    return output_path


def run_analysis(data_dir: Path, output_dir: Path) -> Tuple[Path, List[Path]]:
    bundle = load_datasets(data_dir)
    output_dir = create_output_dir(output_dir)

    district_enriched = compute_district_metrics(bundle.district)
    state_insights = compute_state_level_insights(district_enriched)
    housing_highlights = compute_housing_highlights(bundle.housing)

    plot_paths = [
        ("Top states by total population", plot_top_states_by_population(state_insights["population"], output_dir)),
        ("Literacy vs workforce participation", plot_literacy_vs_workers(district_enriched, output_dir)),
        ("Most common roof materials", plot_roof_material_mix(housing_highlights["roof_mix"], output_dir)),
        ("Average household access to key assets", plot_asset_access(district_enriched, output_dir)),
    ]

    report_path = generate_markdown_report(
        bundle=bundle,
        district_enriched=district_enriched,
        state_insights=state_insights,
        housing_highlights=housing_highlights,
        plots=plot_paths,
        output_path=output_dir / "analysis_summary.md",
    )

    return report_path, [path for _, path in plot_paths]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Explore the India housing and census datasets.")
    parser.add_argument(
        "--data-dir",
        type=Path,
        default=Path(__file__).resolve().parents[1],
        help="Directory containing the CSV files (default: project root).",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "reports",
        help="Directory to write generated reports and figures (default: ./reports).",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    report_path, figures = run_analysis(args.data_dir.resolve(), args.output_dir.resolve())

    print("Analysis complete.")
    print(f"Markdown report: {report_path}")
    for fig in figures:
        print(f"Figure saved: {fig}")


if __name__ == "__main__":
    main()
