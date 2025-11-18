"""Metadata for specification keys including German/English translations and context."""

from typing import TypedDict


class KeyMetadata(TypedDict, total=False):
    """Metadata for a specification key."""

    english: str
    context: str
    category: str


# Comprehensive key metadata with English translations and contextual information
KEY_METADATA: dict[str, KeyMetadata] = {
    # PROJECT INFORMATION
    "Kunde": {
        "english": "Customer",
        "context": (
            "Could be part of the specification; however, it is typically "
            "communicated via email or through regional sales channels"
        ),
        "category": "PROJECT INFORMATION",
    },
    "Ende Kunde": {
        "english": "End Customer",
        "context": (
            "Could be part of the specification; however, it is typically "
            "communicated via email or through regional sales channels"
        ),
        "category": "PROJECT INFORMATION",
    },
    "Projekt": {
        "english": "Name of the project",
        "context": (
            "Could be part of the specification; however, it is typically "
            "communicated via email or through regional sales channels"
        ),
        "category": "PROJECT INFORMATION",
    },
    "Stückzahl": {
        "english": "Quantity required",
        "context": (
            "Could be part of the specification; however, it is typically "
            "communicated via email or through regional sales channels"
        ),
        "category": "PROJECT INFORMATION",
    },
    "Land": {
        "english": "Country",
        "context": (
            "Could be part of the specification; however, it is typically "
            "communicated via email or through regional sales channels"
        ),
        "category": "PROJECT INFORMATION",
    },
    # AMBIENT INFORMATION
    "Aufstellhöhe": {
        "english": "Installation altitude",
        "context": "<=1000m is standard, check with AI the location and provide anyway 'double check'",
        "category": "AMBIENT INFORMATION",
    },
    "Umgebungstemp. Max": {
        "english": "Max Ambient temperature",
        "context": "Shall be by customer defined, check with AI the location and provide anyway 'double check'",
        "category": "AMBIENT INFORMATION",
    },
    "Umgebungstemp. Min": {
        "english": "Min Ambient Temperature",
        "context": "Shall be by customer defined, check with AI the location and provide anyway 'double check'",
        "category": "AMBIENT INFORMATION",
    },
    "Seismische Anforderungen": {
        "english": "Seismic requirement",
        "context": (
            "Could be by Customer required, example in Italy is always 0.5g or defined as AF5. "
            "In California very high according to IEEE standard"
        ),
        "category": "AMBIENT INFORMATION",
    },
    "Windlast": {
        "english": "Wind load",
        "context": "Could be by Customer required, not essential for most of the places",
        "category": "AMBIENT INFORMATION",
    },
    "Eisdicke": {
        "english": "Ice thickness",
        "context": "Could be by Customer required, not essential for most of the places",
        "category": "AMBIENT INFORMATION",
    },
    # MAIN DATA
    "Referenznorm": {
        "english": "Reference Standard",
        "context": "IEC or IEEE or other, see DB_GIF_2025_V_2.0",
        "category": "MAIN DATA",
    },
    "Druckbehältervorschrift": {
        "english": "Pressure vessel regulation",
        "context": "INAIL (Italy), SVTI (Switzerland), AD, EN see DB_GIF_2025_V_2.0",
        "category": "MAIN DATA",
    },
    "Isoliermedium": {"english": "Insulation medium", "context": "SF6 or clean AIR", "category": "MAIN DATA"},
    "Thermische Isolationsklasse": {
        "english": "Thermal insulation class",
        "context": (
            "Specifies the maximum temperature that the transformer's insulation material can withstand. "
            "In general, this is defined by the manufacturer, not by the customer. "
            "For gas-insulated transformers, the thermal insulation class is typically Class E"
        ),
        "category": "MAIN DATA",
    },
    "Anforderung an den inneren Lichtbogen": {
        "english": "Internal arc requirement",
        "context": "To be defined by Customer, class I or class II",
        "category": "MAIN DATA",
    },
    "Maximaler Temperaturanstieg": {
        "english": "Maximum temperature increase",
        "context": "Could be by Customer defined",
        "category": "MAIN DATA",
    },
    "Frequenz": {"english": "Frequency", "context": "Mandatory", "category": "MAIN DATA"},
    "Höchstbetriebsspannung": {"english": "Um Max. operating voltage", "context": "Mandatory", "category": "MAIN DATA"},
    "BIL Blitzstoßspannung": {
        "english": "Lightning Impulse Withstand Voltage (LIWV)",
        "context": "Mandatory",
        "category": "MAIN DATA",
    },
    "BIL Abgeschnittener Blitzstoß": {
        "english": "Chopped Lightning Impulse",
        "context": "Could be by Customer defined",
        "category": "MAIN DATA",
    },
    "SIL Schaltstoßspannung": {
        "english": "Switching Impulse Withstand Voltage (SIWV)",
        "context": "Could be by Customer defined only >=300kV",
        "category": "MAIN DATA",
    },
    "Stehwechselspannung trocken": {
        "english": "Power-frequency withstand test on primary winding dry",
        "context": "Mandatory",
        "category": "MAIN DATA",
    },
    "Stehwechselspannung naß": {
        "english": "Power-frequency withstand test on primary winding wet",
        "context": "Could be by Customer defined",
        "category": "MAIN DATA",
    },
    "Prüfwechselspannung sekundär 1 min": {
        "english": "Power-frequency withstand test on secondary winding 1 min",
        "context": "Could be by Customer defined",
        "category": "MAIN DATA",
    },
    "Prüfwechselspannung sekundär 1 min an Hilfsstromkreisen (Gasüberwachungskontakte)": {
        "english": "Power-frequency withstand 1min test on auxiliary circuits (gas monitor contacts)",
        "context": "Could be by Customer defined",
        "category": "MAIN DATA",
    },
    "Prüfwechselspannung Groß X(N)": {
        "english": "Power-frequency withstand test on primary circuit low-voltage end",
        "context": "Could be by Customer defined",
        "category": "MAIN DATA",
    },
    "Haltespannung bei 1 bars abs oder 0 bars rel": {
        "english": "Power-frequency withstand test on primary winding at zero relative pressure or one bar absolute",
        "context": "Could be by Customer defined",
        "category": "MAIN DATA",
    },
    # INSULATOR PARAMETERS
    "Verschmutzungsklasse": {
        "english": "Pollution level",
        "context": (
            "This will define the min creepage distance requirement in mm/kV for insulators. "
            "Pollution Level I (Light): 16 mm/kV SCD - 27.8 mm/kV RUSCD | "
            "Level II (Medium): 20 mm/kV SCD - 34.7 mm/kV RUSCD | "
            "Level III (Heavy): 25 mm/kV SCD - 43.3 mm/kV RUSCD | "
            "Level IV (Very Heavy): 31 mm/kV SCD - 53.7 mm/kV RUSCD"
        ),
        "category": "INSULATOR PARAMETERS",
    },
    "Min. Kriechweg mm/KV": {
        "english": "Min. Creepage distance",
        "context": "Customer in lieu of pollution class could directly define the xx mm/kV",
        "category": "INSULATOR PARAMETERS",
    },
    "Statische Last": {
        "english": "Static load",
        "context": "Could be by Customer defined",
        "category": "INSULATOR PARAMETERS",
    },
    "Dynamische Last": {
        "english": "Dynamic load",
        "context": "Could be by Customer defined",
        "category": "INSULATOR PARAMETERS",
    },
    "Isolatorauswahl Hersteller": {
        "english": "Isolator manufacturer",
        "context": (
            "In some cases Customer could prefer an insulator over another, "
            "also for INAIL / SVTI we could choose a particular homologated manufacturer"
        ),
        "category": "INSULATOR PARAMETERS",
    },
    # TESTING
    "Externer Beobachter": {
        "english": "External observer",
        "context": (
            "Could be by Customer defined, presence of Customer or third party visitor during routine or type testing"
        ),
        "category": "TESTING",
    },
    "BIL gefordert als Stückprüfung": {
        "english": "BIL required as routine test",
        "context": "Could be by Customer defined",
        "category": "TESTING",
    },
    "SIL gefordert": {"english": "SIL required", "context": "Could be by Customer defined", "category": "TESTING"},
    "Haltespannung bei 1 bar abs.": {
        "english": "Withstand voltage at 1 bar absolute",
        "context": "Could be by Customer defined",
        "category": "TESTING",
    },
    "Magnetisierungskennlinie U": {
        "english": "Magnetization curve U",
        "context": "Could be by Customer defined",
        "category": "TESTING",
    },
    "Magnetisierungskennlinie I": {
        "english": "Magnetization curve I",
        "context": "Could be by Customer defined",
        "category": "TESTING",
    },
    "Taupunktmessung": {
        "english": "Dew point measurement",
        "context": "Could be by Customer defined",
        "category": "TESTING",
    },
    "Isolationswiderstandsmessung": {
        "english": "Insulation resistance measurement",
        "context": "Could be by Customer defined",
        "category": "TESTING",
    },
    "Erweiterte Routinetests & Sonderprüfungen": {
        "english": "Extended routine tests & special tests",
        "context": "Could be by Customer defined",
        "category": "TESTING",
    },
}


# Voltage Transformer (VT) winding metadata template generator
def _generate_vt_winding_metadata(winding_num: int, is_earth_fault: bool = False) -> dict[str, KeyMetadata]:
    """Generate metadata for voltage transformer windings."""
    metadata = {}

    if is_earth_fault:
        prefix_de = "Erdschluss"
        prefix_en = "earth fault winding (open delta)"
        context_suffix = "Extra protection winding (no burden for this type)"

        metadata[f"Nennspannung primär (V) {prefix_de}"] = {
            "english": f"Rated primary voltage (V) {prefix_en}",
            "context": context_suffix,
            "category": "VOLTAGE TRANSFORMER RATING",
        }
        metadata[f"Nennspannung sekundär (V) {prefix_de}"] = {
            "english": f"Rated secondary voltage (V) {prefix_en}",
            "context": context_suffix,
            "category": "VOLTAGE TRANSFORMER RATING",
        }
        metadata[f"Leistung {prefix_de}"] = {
            "english": f"Rated burden for {prefix_en}",
            "context": context_suffix,
            "category": "VOLTAGE TRANSFORMER RATING",
        }
    else:
        context = "Mandatory" if winding_num == 1 else "Extra winding"

        metadata[f"Nennspannung primär (V) Wicklung {winding_num}"] = {
            "english": f"Rated primary voltage (V) winding {winding_num}",
            "context": context,
            "category": "VOLTAGE TRANSFORMER RATING",
        }
        metadata[f"Nennspannung sekundär (V) Wicklung {winding_num}"] = {
            "english": f"Rated secondary voltage (V) winding {winding_num}",
            "context": context,
            "category": "VOLTAGE TRANSFORMER RATING",
        }
        metadata[f"Genauigkeitsklasse Wicklung {winding_num}"] = {
            "english": f"Accuracy class winding {winding_num}",
            "context": context,
            "category": "VOLTAGE TRANSFORMER RATING",
        }
        metadata[f"Leistung Wicklung {winding_num}"] = {
            "english": f"Rated burden winding {winding_num}",
            "context": context,
            "category": "VOLTAGE TRANSFORMER RATING",
        }

    return metadata


# Current Transformer (CT) core metadata template generator
def _generate_ct_core_metadata(core_num: int) -> dict[str, KeyMetadata]:
    """Generate metadata for current transformer cores."""
    metadata = {}

    # Common thermal parameters (not core-specific but included for completeness)
    if core_num == 1:
        metadata["Thermische dauerstrom (% oder faktor)"] = {
            "english": "Thermal current continuous (% or factor)",
            "context": "Could be by Customer defined",
            "category": "CURRENT TRANSFORMER RATING",
        }
        metadata["Thermische notfall strom (% oder faktor)"] = {
            "english": "Thermal emergency current (% or factor)",
            "context": "Could be by Customer defined",
            "category": "CURRENT TRANSFORMER RATING",
        }
        metadata["Ith / zeit = Thermischer Kurzzeitstrom / Zeit"] = {
            "english": "Thermal short-time current / duration",
            "context": "Could be by Customer defined",
            "category": "CURRENT TRANSFORMER RATING",
        }
        metadata["Idyn = Dynamischer Kurzschlussstrom"] = {
            "english": "Dynamic short-circuit current",
            "context": "Could be by Customer defined",
            "category": "CURRENT TRANSFORMER RATING",
        }

    # Core-specific basic parameters
    metadata[f"Nennstrom primär (A) Kern {core_num}"] = {
        "english": f"Rated primary current (A) core {core_num}",
        "context": "Metering & Protection",
        "category": "CURRENT TRANSFORMER RATING",
    }
    metadata[f"Nennstrom sekundär (A) Kern {core_num}"] = {
        "english": f"Rated secondary current (A) core {core_num}",
        "context": "Metering & Protection",
        "category": "CURRENT TRANSFORMER RATING",
    }
    metadata[f"Genauigkeitsklasse Kern {core_num}"] = {
        "english": f"Accuracy class core {core_num}",
        "context": "Mainly Metering cores (Class 0.1-1) - also applies to Protection for accuracy classes",
        "category": "CURRENT TRANSFORMER RATING",
    }
    metadata[f"Leistung VA Kern {core_num}"] = {
        "english": f"Rated burden (VA) core {core_num}",
        "context": "Mainly Metering cores (Class 0.1-1) - also applies to Protection for accuracy classes",
        "category": "CURRENT TRANSFORMER RATING",
    }
    metadata[f"Erweiterter Messbereich (% or factor) Kern {core_num}"] = {
        "english": f"Extended measuring range (% or factor) core {core_num}",
        "context": "Mainly Metering cores (Class 0.1-1) - also applies to Protection for accuracy classes",
        "category": "CURRENT TRANSFORMER RATING",
    }

    # Protection core parameters (P/PR/TP classes)
    metadata[f"Rct - Sekundärwiderstand (ohm) Kern {core_num}"] = {
        "english": f"Secondary winding resistance Rct (Ω) core {core_num}",
        "context": "Protection core only (P/PR/TP classes)",
        "category": "CURRENT TRANSFORMER RATING",
    }
    metadata[f"Ek = Kniepunkt (V) Kern {core_num}"] = {
        "english": f"Knee-point voltage Ek (V) core {core_num}",
        "context": "Protection core only (P/PR/TP classes)",
        "category": "CURRENT TRANSFORMER RATING",
    }
    metadata[f"Ie - Magnetisierungsstrom (mA) Kern {core_num}"] = {
        "english": f"Excitation current Ie (mA) core {core_num}",
        "context": "Protection core only (P/PR/TP classes)",
        "category": "CURRENT TRANSFORMER RATING",
    }
    metadata[f"Kssc = Kurzschlußstromfaktor Kern {core_num}"] = {
        "english": f"Short-circuit current factor Kssc core {core_num}",
        "context": "Protection core only (P/PR/TP classes)",
        "category": "CURRENT TRANSFORMER RATING",
    }
    metadata[f"Ktd = Dimensionierungsfaktor Kern {core_num}"] = {
        "english": f"Transient dimensioning factor Ktd core {core_num}",
        "context": "Protection core only (P/PR/TP classes)",
        "category": "CURRENT TRANSFORMER RATING",
    }
    metadata[f"Bemessungszeitkonstante primär Tp (ms) Kern {core_num}"] = {
        "english": f"Rated primary time constant Tp (ms) core {core_num}",
        "context": "Protection core only (P/PR/TP classes)",
        "category": "CURRENT TRANSFORMER RATING",
    }
    metadata[f"Bemessungszeitkonstante sekundär Ts (ms) Kern {core_num}"] = {
        "english": f"Rated secondary time constant Ts (ms) core {core_num}",
        "context": "Protection core only (P/PR/TP classes)",
        "category": "CURRENT TRANSFORMER RATING",
    }
    metadata[f"Stromfluß 1 t´ [ms] Kern {core_num}"] = {
        "english": f"Flux time constant t' (ms) core {core_num}",
        "context": "Protection core only (P/PR/TP classes)",
        "category": "CURRENT TRANSFORMER RATING",
    }
    metadata[f"Stromfluß 1 tal´ [ms] Kern {core_num}"] = {
        "english": f"Permissible flux duration tal' (ms) core {core_num}",
        "context": "Protection core only (P/PR/TP classes)",
        "category": "CURRENT TRANSFORMER RATING",
    }
    metadata[f"Stromfluß 2 t´´ [ms] Kern {core_num}"] = {
        "english": f"Second flux time constant t'' (ms) core {core_num}",
        "context": "Protection core only (P/PR/TP classes)",
        "category": "CURRENT TRANSFORMER RATING",
    }
    metadata[f"Stromfluß 2 tal´´ [ms] Kern {core_num}"] = {
        "english": f"Second permissible flux duration tal'' (ms) core {core_num}",
        "context": "Protection core only (P/PR/TP classes)",
        "category": "CURRENT TRANSFORMER RATING",
    }
    metadata[f"Totzeit ttfr [ms] Kern {core_num}"] = {
        "english": f"Response time ttfr (ms) core {core_num}",
        "context": "Protection core only (P/PR/TP classes)",
        "category": "CURRENT TRANSFORMER RATING",
    }

    return metadata


# Generate all VT winding metadata (Wicklung 1-5 + Erdschluss)
for winding in range(1, 6):
    KEY_METADATA.update(_generate_vt_winding_metadata(winding))
KEY_METADATA.update(_generate_vt_winding_metadata(0, is_earth_fault=True))

# Generate all CT core metadata (Kern 1-7)
for core in range(1, 8):
    KEY_METADATA.update(_generate_ct_core_metadata(core))


# GAS INFORMATION
KEY_METADATA.update(
    {
        "Zulässige Leckrate": {
            "english": "Permissible leakage rate",
            "context": "In general is 0.1 or 0.5% p.a.",
            "category": "GAS INFORMATION",
        },
        "Druckfüllventil": {
            "english": "Pressure filling valve",
            "context": "Type and number of filling valve. SF6 standard is 1XDN20, clean air standard is 1XNW20",
            "category": "GAS INFORMATION",
        },
        "DW-Hersteller": {
            "english": "DM manufacturer",
            "context": "Could be by Customer defined. DW=Dichtewächter, DM=Density monitor",
            "category": "GAS INFORMATION",
        },
        "DW nennspannnung-strom": {
            "english": "DM rated voltage and current",
            "context": "Could be by Customer defined",
            "category": "GAS INFORMATION",
        },
        "Druckangabe am Dichtewächter": {
            "english": "Pressure indication at density monitor",
            "context": "Could be by Customer defined",
            "category": "GAS INFORMATION",
        },
        "Hybrid Densimeter": {
            "english": "Hybrid densimeter",
            "context": "Could be by Customer defined",
            "category": "GAS INFORMATION",
        },
        "DW-Prüfeinrichtung": {
            "english": "DM test device",
            "context": "Could be by Customer defined",
            "category": "GAS INFORMATION",
        },
        "Anzahl DW Schaltkontakte": {
            "english": "Number of DW switching contacts",
            "context": "Could be by Customer defined",
            "category": "GAS INFORMATION",
        },
        "DW zum Boden geneigt": {
            "english": "DM tilted toward bottom",
            "context": "Could be by Customer defined",
            "category": "GAS INFORMATION",
        },
        "Schutzschlauch DW-Kabel": {
            "english": "Protective sleeve for DM cable",
            "context": "Could be by Customer defined",
            "category": "GAS INFORMATION",
        },
        "DW im KK verdrahtet": {
            "english": "DM wired in terminal box",
            "context": "Could be by Customer defined",
            "category": "GAS INFORMATION",
        },
        "DW Schaltkontaktebei fallendem Druck": {
            "english": "DM contacts on falling pressure",
            "context": "Could be by Customer defined",
            "category": "GAS INFORMATION",
        },
        "Erdkontakte seperat geerdet": {
            "english": "Earth contacts separately grounded",
            "context": "Could be by Customer defined",
            "category": "GAS INFORMATION",
        },
    }
)

# CONSTRUCTION INFORMATION
KEY_METADATA.update(
    {
        "Primäranschluss": {
            "english": "Primary terminal",
            "context": "Type of primary connection and material of the same if specified",
            "category": "CONSTRUCTION INFORMATION",
        },
        "Erdungsanschluss": {
            "english": "Earthing terminal",
            "context": "Distance holes",
            "category": "CONSTRUCTION INFORMATION",
        },
        "Beistellteile TG seitig": {
            "english": "Extra Accessories from TG side",
            "context": "Could be by Customer defined",
            "category": "CONSTRUCTION INFORMATION",
        },
        "Korrosionsanforderung": {
            "english": "Corrosion requirement",
            "context": "Could be by Customer defined",
            "category": "CONSTRUCTION INFORMATION",
        },
        "Lackart und Farbe": {
            "english": "Paint type and color",
            "context": "Could be by Customer defined",
            "category": "CONSTRUCTION INFORMATION",
        },
        "Klemmenkastenart": {
            "english": "Terminal box type",
            "context": "Could be by Customer defined, e.g. big terminal box that can withstand 100kg",
            "category": "CONSTRUCTION INFORMATION",
        },
        "Klemmentype": {
            "english": "Terminal type",
            "context": "Could be by Customer defined",
            "category": "CONSTRUCTION INFORMATION",
        },
        "Klemmentype DW": {
            "english": "DW terminal type",
            "context": "Could be by Customer defined",
            "category": "CONSTRUCTION INFORMATION",
        },
        "Klemmenkastenheizung": {
            "english": "Terminal box heating",
            "context": "Could be by Customer defined",
            "category": "CONSTRUCTION INFORMATION",
        },
        "Material Erdungsanschluss": {
            "english": "Grounding terminal material",
            "context": "Customer could require some type of bolts or remove plate for earthing",
            "category": "CONSTRUCTION INFORMATION",
        },
        "Abdeckung Kundenklemmen": {
            "english": "Customer terminal cover",
            "context": "For metering core to be submitted to certified calibration (like DAKKS in DE, UTF in Italy)",
            "category": "CONSTRUCTION INFORMATION",
        },
        "Sicherungen": {
            "english": "Fuses",
            "context": "Could be by Customer required, only for VT / PVT",
            "category": "CONSTRUCTION INFORMATION",
        },
        "Detail der Sicherungen": {
            "english": "Fuse details / Fuse specification",
            "context": "Could be by Customer required, only for VT / PVT",
            "category": "CONSTRUCTION INFORMATION",
        },
        "Sollbruchstellen": {
            "english": "Intended break points / Pre-defined fuse links",
            "context": "Could be by Customer required, only for VT",
            "category": "CONSTRUCTION INFORMATION",
        },
        "Hilfsschalterart": {
            "english": "Auxiliary switch type",
            "context": "Could be by Customer required, only for VT",
            "category": "CONSTRUCTION INFORMATION",
        },
        "PT100 gefordert": {
            "english": "PT100 required",
            "context": "Could be by Customer required, only for VT / PVT",
            "category": "CONSTRUCTION INFORMATION",
        },
        "Funkenstrecke": {
            "english": "Spark gap",
            "context": "Could be by Customer required, only for VT / PVT",
            "category": "CONSTRUCTION INFORMATION",
        },
        "Sprache Leistungsschild": {
            "english": "Nameplate language",
            "context": "Could be by Customer defined",
            "category": "CONSTRUCTION INFORMATION",
        },
        "Barcode auf LS": {
            "english": "Barcode on nameplate",
            "context": "Could be by Customer defined",
            "category": "CONSTRUCTION INFORMATION",
        },
        "Hersteller ID-Nr. auf LS": {
            "english": "Manufacturer ID number on nameplate",
            "context": "Could be by Customer defined",
            "category": "CONSTRUCTION INFORMATION",
        },
        "Material Leistungsschild": {
            "english": "Nameplate material",
            "context": "Could be by Customer defined",
            "category": "CONSTRUCTION INFORMATION",
        },
        "Wandlerbezeichnung auf LS": {
            "english": "Transformer designation on nameplate",
            "context": "Could be by Customer defined",
            "category": "CONSTRUCTION INFORMATION",
        },
        "Kabelverschraubungen": {
            "english": "Cable glands",
            "context": "Could be by Customer defined",
            "category": "CONSTRUCTION INFORMATION",
        },
        "Erdungsschiene / Erdungsbolzen": {
            "english": "Grounding bar / earthing bolt",
            "context": "Could be by Customer defined",
            "category": "CONSTRUCTION INFORMATION",
        },
    }
)


def get_key_metadata(key_name: str) -> KeyMetadata | None:
    """
    Get metadata for a specific key.

    Args:
        key_name: The name of the key (in German)

    Returns:
        KeyMetadata dict if found, None otherwise
    """
    return KEY_METADATA.get(key_name)


def format_key_metadata_for_prompt(key_name: str) -> str:
    """
    Format key metadata for inclusion in LLM prompts.

    Args:
        key_name: The name of the key (in German)

    Returns:
        Formatted string with key metadata, or empty string if no metadata found
    """
    metadata = get_key_metadata(key_name)
    if not metadata:
        return ""

    parts = [f"Key: {key_name}"]

    english = metadata.get("english")
    if english:
        parts.append(f"English: {english}")

    context = metadata.get("context")
    if context:
        parts.append(f"Context: {context}")

    category = metadata.get("category")
    if category:
        parts.append(f"Category: {category}")

    return "\n".join(parts)
