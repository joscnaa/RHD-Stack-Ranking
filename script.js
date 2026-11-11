document.addEventListener("DOMContentLoaded", async () => {
  const tableBody = document.getElementById("tableBody");
  const monthButtons = document.querySelectorAll(".month-pill");
  const regionButtons = document.querySelectorAll(".region-tab");
  const reportTitle = document.querySelector(".report-title");

  if (!tableBody) {
    return;
  }

  const monthFiles = {
    "August 2026": "./August-data.json",
    "September 2026": "./September-data.json",
    "October 2026": "./october-ranking.json"
  };

  const tier2Names = [
    "Kayla Spencer",
    "Marie Koroma",
    "Tim Tuggle",
    "Valerie Cooksey",
    "Kyle Lenoir",
    "Justin Bennett",
    "Dante Ricketts",
    "Ahmedou Biteye"
  ];

  const usNames = [
    "Mary Goodwin Freeling",
    "Reggie Jackson",
    "Simon Casstevens",
    "Razah Stewart",
    "Alexander Gordon",
    "Jerrod Graham",
    "Clodette Felix",
    "Javonni Blake",
    "Matthew Messer",
    "Javiel Ricketts",
    "Shallom Kigbu",
    "CJ Ball",
    "Adrian Whitmire",
    "Bryanna Harris",
    "Daniel Alvarez",
    "Luke Hill",
    "Gabriel Mozu",
    "James Hayles"
  ];

  const indiaNames = [
    "Mohammad Sameer",
    "Jagdishwar Pendyala",
    "Mohammed Quddus",
    "Mazhar Mohammed",
    "Shaik Azeemulla",
    "Mohd Ansari",
    "Sudharshan Puttapogula",
    "Mohammed Adil",
    "Mahesh Sandineni",
    "Satheesh Kumar",
    "Shiva Nagendra",
    "Ravi Kishore",
    "Nagendra Babu",
    "Ramesh Buddha",
    "Akshay Kumar",
    "Akshaisai Ande",
    "Boyine Nagaraju",
    "Deepak Goud",
    "Manish Donthi"
  ];

  let agents = [];
  let activeRegion = null;

  const setMonthButtonState = (selectedMonth) => {
    monthButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.month === selectedMonth);
    });

    if (reportTitle) {
      reportTitle.textContent = `${selectedMonth} Stack Ranking`;
    }
  };

  const loadMonthData = async (selectedMonth) => {
    const fileName = monthFiles[selectedMonth];
    if (!fileName) {
      return;
    }

    try {
      const response = await fetch(fileName);
      if (!response.ok) {
        throw new Error(`Unable to load ${fileName}`);
      }
      agents = await response.json();
      setMonthButtonState(selectedMonth);
      render();
    } catch (error) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="9">Unable to load score data. Please serve the folder over a local web server.</td>
        </tr>
      `;
      console.error(error);
    }
  };

  const render = () => {
    const filtered = agents
      .filter((agent) => {
        if (!activeRegion) {
          return true;
        }

        const name = String(agent["Agent Name"] || "").trim();
        const matchesTier2 = tier2Names.some((tier2Name) => {
          const target = tier2Name.toLowerCase();
          const actual = name.toLowerCase();
          return actual === target || actual.includes(target) || target.includes(actual);
        });

        if (activeRegion === "Tier 2") {
          return matchesTier2;
        }
        if (activeRegion === "US") {
          const matchesUs = usNames.some((usName) => {
            const target = usName.toLowerCase();
            const actual = name.toLowerCase();
            return actual === target || actual.includes(target) || target.includes(actual);
          });
          return matchesUs;
        }
        if (activeRegion === "India") {
          const matchesIndia = indiaNames.some((indiaName) => {
            const target = indiaName.toLowerCase();
            const actual = name.toLowerCase();
            return actual === target || actual.includes(target) || target.includes(actual);
          });
          return matchesIndia;
        }
        return true;
      })
      .sort((a, b) => Number(b["Overall Ratings"]) - Number(a["Overall Ratings"]));

    tableBody.innerHTML = filtered
      .map((agent) => {
        const overall = Number(agent["Overall Ratings"]);
        const qa = Number(agent["Average QA"]);
        const survey = agent["Survey Ratings"] == null ? "" : Number(agent["Survey Ratings"]);
        const logging = Number(agent["Average Logging"]);
        const adherence = Number(agent["Average Adherence"]);
        const attendance = Number(agent["Average Attendance"]);
        const ringNoAnswer = Number(agent["Ring No Answer"] || 0);

        return `
          <tr>
            <td>${escapeHtml(agent["Agent Name"])}</td>
            <td style="${getOverallRatingStyle(overall)}">${formatNumber(overall)}</td>
            <td class="${getMetricClass("qa", qa)}">${formatPercent(qa)}</td>
            <td class="${survey === "" ? "" : getMetricClass("survey", survey)}">${survey === "" ? "" : formatNumber(survey)}</td>
            <td class="${getMetricClass("logging", logging)}">${formatPercent(logging)}</td>
            <td class="${getMetricClass("adherence", adherence)}">${formatPercent(adherence)}</td>
            <td class="${getMetricClass("ring", ringNoAnswer)}">${ringNoAnswer >= 1 ? "100%" : ringNoAnswer}</td>
            <td class="${getMetricClass("handleTime", parseHandleTime(agent["Avg Handle Time"]))}">${agent["Avg Handle Time"]}</td>
            <td class="${getMetricClass("attendance", attendance)}">${formatPercent(attendance)}</td>
          </tr>
        `;
      })
      .join("") + renderTotalRow(filtered);
  };

  monthButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      const selectedMonth = button.dataset.month;
      if (!selectedMonth) {
        return;
      }

      await loadMonthData(selectedMonth);
    });
  });

  regionButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const clickedRegion = button.dataset.region;

      activeRegion = activeRegion === clickedRegion ? null : clickedRegion;

      regionButtons.forEach((btn) => {
        btn.classList.toggle("active", activeRegion && btn.dataset.region === activeRegion);
      });

      render();
    });
  });

  await loadMonthData("October 2026");
});

function renderTotalRow(rows) {
  if (!rows.length) {
    return "";
  }

  const averageOverall = rows.reduce((sum, row) => sum + Number(row["Overall Ratings"]), 0) / rows.length;
  const averageQA = rows.reduce((sum, row) => sum + Number(row["Average QA"]), 0) / rows.length;
  const averageSurvey = rows.reduce((sum, row) => sum + (row["Survey Ratings"] == null ? 0 : Number(row["Survey Ratings"])), 0) / rows.filter((row) => row["Survey Ratings"] != null).length || 0;
  const averageLogging = rows.reduce((sum, row) => sum + Number(row["Average Logging"]), 0) / rows.length;
  const averageAdherence = rows.reduce((sum, row) => sum + Number(row["Average Adherence"]), 0) / rows.length;
  const averageAttendance = rows.reduce((sum, row) => sum + Number(row["Average Attendance"]), 0) / rows.length;

  return `
    <tr class="total-row">
      <td>Total</td>
      <td>${formatNumber(averageOverall)}</td>
      <td>${formatPercent(averageQA)}</td>
      <td>${formatNumber(averageSurvey)}</td>
      <td>${formatPercent(averageLogging)}</td>
      <td>${formatPercent(averageAdherence)}</td>
      <td>100%</td>
      <td>00:13:41</td>
      <td>${formatPercent(averageAttendance)}</td>
    </tr>
  `;
}

function getOverallRatingStyle(value) {
  if (value <= 1.99) return "background-color: #BE5014; color: #111111; font-weight: 600;";
  if (value <= 2.99) return "background-color: #FFC000; color: #111111; font-weight: 600;";
  if (value <= 3.99) return "background-color: #FFFF00; color: #111111; font-weight: 600;";
  if (value <= 4.49) return "background-color: #A6C9EC; color: #111111; font-weight: 600;";
  if (value <= 4.8) return "background-color: #00B0F0; color: #111111; font-weight: 600;";
  return "background-color: rgba(122, 207, 114, 0.92); color: #111111; font-weight: 600;";
}

function getMetricClass(metric, value) {
  if (metric === "overall") {
    return "";
  }

  if (metric === "qa") {
    const numeric = Number(value) * 100;
    if (numeric >= 98) return "cell-green";
    if (numeric >= 95) return "cell-blue";
    if (numeric >= 90) return "cell-yellow";
    if (numeric >= 85) return "cell-orange";
    return "cell-red";
  }

  if (metric === "survey") {
    const numeric = Number(value);
    if (numeric >= 5) return "cell-green";
    if (numeric >= 4.99) return "cell-blue";
    if (numeric >= 3.99) return "cell-yellow";
    if (numeric >= 2.99) return "cell-orange";
    return "cell-red";
  }

  if (metric === "logging" || metric === "attendance" || metric === "adherence") {
    const numeric = Number(value) * 100;
    if (numeric >= 99) return "cell-green";
    if (numeric >= 97) return "cell-blue";
    if (numeric >= 95) return "cell-yellow";
    if (numeric >= 90) return "cell-orange";
    return "cell-red";
  }

  if (metric === "ring") {
    const numeric = Number(value) * 100;
    if (numeric >= 100) return "cell-green";
    if (numeric >= 99) return "cell-blue";
    if (numeric >= 97) return "cell-yellow";
    if (numeric >= 94) return "cell-orange";
    return "cell-red";
  }

  if (metric === "handleTime") {
    if (value <= 959) return "cell-green";
    if (value <= 1109) return "cell-blue";
    if (value <= 1500) return "cell-yellow";
    if (value <= 1950) return "cell-orange";
    return "cell-red";
  }

  return "";
}

function parseHandleTime(value) {
  if (!value || typeof value !== "string") return 0;
  const parts = value.split(":").map(Number);
  if (parts.length !== 3) return 0;
  const [hours, minutes, seconds] = parts;
  return hours * 3600 + minutes * 60 + seconds;
}

function formatPercent(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const number = Number(value) * 100;
  return `${number.toFixed(2)} %`;
}

function formatNumber(value) {
  if (value === null || value === undefined || value === "") {
    return "";
  }

  const number = Number(value);
  if (Number.isNaN(number)) {
    return "";
  }

  return number.toFixed(2);
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
