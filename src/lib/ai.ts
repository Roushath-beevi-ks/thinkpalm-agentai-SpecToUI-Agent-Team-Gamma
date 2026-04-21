import { UIComponentNode, UIGenerationResult } from "@/lib/types";
import { parseEmployeeMetricChartIntent } from "@/lib/chart-intent";
import {
  extractCoreFeatureLines,
  extractDisplayHeader,
  extractProductName
} from "@/lib/prd-metadata";

const systemPrompt = `
You are a senior React/Tailwind UI architect.
Generate a strict JSON object only, no markdown.
The JSON must match this exact schema:
{
  "appName": "string",
  "description": "string",
  "componentTree": {
    "name": "string",
    "purpose": "string",
    "tailwindClasses": "string",
    "props": {},
    "children": []
  }
}
Rules:
- Output valid JSON only.
- Build a complete, realistic UI hierarchy from the PRD.
- appName must be the short product name only (e.g. from "Product Name: MyApp" use "MyApp"), never the full overview paragraph.
- For task apps, include search, filters, task rows, and per-row actions (edit, delete, mark complete) where the PRD asks for them.
- For sign-up / account creation, include full name, email, password, confirm password, terms acceptance, submit, and link to sign in.
- For employee / HR lookup forms, include identifier fields, fetch action, and a read-only results or detail panel.
- For stress or salary (compensation) vs. employee-count charts, include a titled analytics region and bar or line series appropriate to the PRD.
- For analytics / BI SaaS dashboards (e.g. InsightBoard): include a blue left Sidebar (Dashboard, Reports, Users, Settings), top bar with search and profile, a row of KPI metric cards (revenue, users, growth), filter chips and date range, and main grid with line chart (trends), bar chart (categories), pie or donut (distribution), recent activity list, and progress bars. Use card-based layout, rounded-2xl, shadow-md, light gray page background.
- Use semantic component names (DashboardPage, Header, Sidebar, etc.).
- Add practical Tailwind classes for spacing, layout, typography, color and states.
- Ensure tree is renderable and nested correctly.
`;

function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function toPageName(prdText: string): string {
  const firstLine = prdText.split("\n").find((line) => line.trim().length > 0) ?? "";
  const cleanFirstLine = firstLine
    .replace(/^build\s+/i, "")
    .replace(/^create\s+/i, "")
    .replace(/^design\s+/i, "");
  const title = toTitleCase(cleanFirstLine).replace(/\s+/g, "");
  return title ? `${title}Page` : "GeneratedAppPage";
}

function toDisplayTitleFromPageName(pageName: string): string {
  return pageName
    .replace(/Page$/, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .trim();
}

function extractFeatureLines(prdText: string): string[] {
  return prdText
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => line.startsWith("-") || line.startsWith("*"))
    .map((line) => line.replace(/^[-*]\s*/, ""));
}

function buildRuleBasedFallbackTree(prdText: string): UIComponentNode {
  const features = extractFeatureLines(prdText);
  const displayFeatures =
    features.length > 0
      ? features.slice(0, 6)
      : ["Define key workflows", "Add main actions", "Create responsive layout"];

  const hasFilter = displayFeatures.some((line) => /filter|search|sort/i.test(line));
  const hasCreate = displayFeatures.some((line) => /add|create|new/i.test(line));
  const isSignupIntent =
    /account\s*creation|create\s+account|sign\s*up|signup|register|registration|new\s+user|join\s+now/i.test(
      prdText
    );
  const isLoginIntent =
    /login|log in|sign in|signin|authentication|auth\b/i.test(prdText) && !isSignupIntent;
  const isButtonIntent = /button|cta|call to action/i.test(prdText);
  const isPageIntent = /page|screen|dashboard|app|layout/i.test(prdText);
  /** Local fallback when PRD asks for a form to fetch/look up employee (not task apps). */
  const isEmployeeLookupForm =
    /employee|staff|\bhr\b/i.test(prdText) &&
    /form|fetch|lookup|details?|retrieve|search|find/i.test(prdText) &&
    !/task\s+(management|list|board)|\btodo\b|taskflow/i.test(prdText);
  const employeeMetricChartKind = parseEmployeeMetricChartIntent(prdText);
  const pageName = toPageName(prdText);
  const appTitle = toDisplayTitleFromPageName(pageName) || "Generated App";

  if (
    isButtonIntent &&
    !isPageIntent &&
    !isLoginIntent &&
    !isSignupIntent &&
    !isEmployeeLookupForm &&
    !employeeMetricChartKind
  ) {
    return {
      name: "ButtonComponent",
      purpose: "Reusable button component",
      tailwindClasses: "p-4 bg-slate-50 rounded-lg",
      children: [
        {
          name: "PrimaryButton",
          purpose: "Main call-to-action button",
          tailwindClasses:
            "rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700",
          props: { text: "Click Me" }
        }
      ]
    };
  }

  if (isSignupIntent) {
    const product = extractProductName(prdText);
    const brand = product || "App";
    return {
      name: "AccountCreationPage",
      purpose: "Registration / sign-up screen",
      tailwindClasses:
        "min-h-screen bg-slate-100 flex items-center justify-center p-6",
      children: [
        {
          name: "SignupCard",
          purpose: "Centered registration form",
          tailwindClasses:
            "w-full max-w-md rounded-xl bg-white p-6 shadow-lg border border-slate-200",
          children: [
            {
              name: "Header",
              purpose: "Sign-up heading",
              tailwindClasses: "mb-6 text-center",
              children: [
                {
                  name: "Title",
                  purpose: "Primary heading",
                  tailwindClasses: "text-2xl font-bold text-slate-900",
                  props: { text: "Create account" }
                },
                {
                  name: "Subtitle",
                  purpose: "Context",
                  tailwindClasses: "mt-1 text-sm text-slate-500",
                  props: {
                    text: `Join ${brand} — enter your details below.`
                  }
                }
              ]
            },
            {
              name: "SignupForm",
              purpose: "New user registration fields",
              tailwindClasses: "space-y-4",
              children: [
                {
                  name: "FullNameInput",
                  purpose: "Display name",
                  tailwindClasses:
                    "w-full rounded-md border border-slate-300 px-3 py-2 text-sm",
                  props: { placeholder: "Full name" }
                },
                {
                  name: "EmailInput",
                  purpose: "Email address",
                  tailwindClasses:
                    "w-full rounded-md border border-slate-300 px-3 py-2 text-sm",
                  props: { placeholder: "Email address" }
                },
                {
                  name: "PasswordInput",
                  purpose: "Choose password",
                  tailwindClasses:
                    "w-full rounded-md border border-slate-300 px-3 py-2 text-sm",
                  props: { placeholder: "Password (8+ characters)" }
                },
                {
                  name: "ConfirmPasswordInput",
                  purpose: "Confirm password",
                  tailwindClasses:
                    "w-full rounded-md border border-slate-300 px-3 py-2 text-sm",
                  props: { placeholder: "Confirm password" }
                },
                {
                  name: "TermsRow",
                  purpose: "Accept terms",
                  tailwindClasses: "flex items-start gap-2 text-sm text-slate-600",
                  children: [
                    {
                      name: "TermsCheckbox",
                      purpose: "Agree to terms",
                      tailwindClasses:
                        "mt-1 h-4 w-4 rounded border-slate-300 text-blue-600"
                    },
                    {
                      name: "TermsLabel",
                      purpose: "Legal copy",
                      tailwindClasses: "leading-snug",
                      props: {
                        text: "I agree to the Terms of Service and Privacy Policy."
                      }
                    }
                  ]
                },
                {
                  name: "CreateAccountButton",
                  purpose: "Submit registration",
                  tailwindClasses:
                    "w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700",
                  props: { text: "Create account" }
                },
                {
                  name: "FooterLinks",
                  purpose: "Switch to sign in",
                  tailwindClasses: "text-center text-sm text-slate-600",
                  children: [
                    {
                      name: "SignInLink",
                      purpose: "Existing user",
                      tailwindClasses: "text-blue-600 hover:underline",
                      props: { text: "Already have an account? Sign in" }
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    };
  }

  if (isLoginIntent) {
    return {
      name: "LoginPage",
      purpose: "Authentication screen for user sign in",
      tailwindClasses:
        "min-h-screen bg-slate-100 flex items-center justify-center p-6",
      children: [
        {
          name: "LoginCard",
          purpose: "Centered login form container",
          tailwindClasses:
            "w-full max-w-md rounded-xl bg-white p-6 shadow-lg border border-slate-200",
          children: [
            {
              name: "Header",
              purpose: "Login page heading",
              tailwindClasses: "mb-6 text-center",
              children: [
                {
                  name: "Title",
                  purpose: "Primary heading",
                  tailwindClasses: "text-2xl font-bold text-slate-900",
                  props: { text: "Login" }
                },
                {
                  name: "Subtitle",
                  purpose: "Secondary heading text",
                  tailwindClasses: "mt-1 text-sm text-slate-500",
                  props: { text: "Sign in to continue to your account." }
                }
              ]
            },
            {
              name: "LoginForm",
              purpose: "User credentials form",
              tailwindClasses: "space-y-4",
              children: [
                {
                  name: "EmailInput",
                  purpose: "User email input",
                  tailwindClasses:
                    "w-full rounded-md border border-slate-300 px-3 py-2 text-sm",
                  props: { placeholder: "Email address" }
                },
                {
                  name: "PasswordInput",
                  purpose: "User password input",
                  tailwindClasses:
                    "w-full rounded-md border border-slate-300 px-3 py-2 text-sm",
                  props: { placeholder: "Password" }
                },
                {
                  name: "LoginButton",
                  purpose: "Submit sign-in form",
                  tailwindClasses:
                    "w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700",
                  props: { text: "Sign In" }
                },
                {
                  name: "HelperLinks",
                  purpose: "Password reset and sign up actions",
                  tailwindClasses: "flex justify-between text-xs text-blue-600",
                  children: [
                    {
                      name: "ForgotPasswordLink",
                      purpose: "Recovery action",
                      tailwindClasses: "hover:underline",
                      props: { text: "Forgot password?" }
                    },
                    {
                      name: "SignUpLink",
                      purpose: "Create account action",
                      tailwindClasses: "hover:underline",
                      props: { text: "Create account" }
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    };
  }

  if (isEmployeeLookupForm) {
    return {
      name: "EmployeeLookupPage",
      purpose: "Form to fetch and display employee details",
      tailwindClasses:
        "min-h-screen bg-slate-100 flex items-center justify-center p-6",
      children: [
        {
          name: "LookupCard",
          purpose: "Main form card",
          tailwindClasses:
            "w-full max-w-lg rounded-xl bg-white p-6 shadow-lg border border-slate-200",
          children: [
            {
              name: "Header",
              purpose: "Title row",
              tailwindClasses: "mb-6",
              children: [
                {
                  name: "Title",
                  purpose: "Screen title",
                  tailwindClasses: "text-xl font-bold text-slate-900",
                  props: { text: "Employee details" }
                },
                {
                  name: "Subtitle",
                  purpose: "Instructions",
                  tailwindClasses: "mt-1 text-sm text-slate-500",
                  props: {
                    text: "Enter an identifier and fetch to load employee information."
                  }
                }
              ]
            },
            {
              name: "LookupForm",
              purpose: "Search / fetch inputs",
              tailwindClasses: "space-y-4",
              children: [
                {
                  name: "EmployeeIdInput",
                  purpose: "Primary lookup key",
                  tailwindClasses:
                    "w-full rounded-md border border-slate-300 px-3 py-2 text-sm",
                  props: { placeholder: "Employee ID" }
                },
                {
                  name: "EmployeeEmailInput",
                  purpose: "Optional second key",
                  tailwindClasses:
                    "w-full rounded-md border border-slate-300 px-3 py-2 text-sm",
                  props: { placeholder: "Work email (optional)" }
                },
                {
                  name: "DepartmentInput",
                  purpose: "Filter context",
                  tailwindClasses:
                    "w-full rounded-md border border-slate-300 px-3 py-2 text-sm",
                  props: { placeholder: "Department (optional)" }
                },
                {
                  name: "FetchEmployeeButton",
                  purpose: "Submit lookup",
                  tailwindClasses:
                    "w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700",
                  props: { text: "Fetch employee" }
                }
              ]
            },
            {
              name: "ResultsPanel",
              purpose: "Read-only detail area after fetch",
              tailwindClasses:
                "mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2",
              children: [
                {
                  name: "ResultsTitle",
                  purpose: "Section label",
                  tailwindClasses: "text-xs font-semibold uppercase tracking-wide text-slate-500",
                  props: { text: "Result preview" }
                },
                {
                  name: "ResultNameRow",
                  purpose: "Name field",
                  tailwindClasses: "flex justify-between gap-2 text-sm",
                  children: [
                    {
                      name: "LabelName",
                      purpose: "Label",
                      tailwindClasses: "text-slate-500",
                      props: { text: "Name" }
                    },
                    {
                      name: "ValueName",
                      purpose: "Placeholder value",
                      tailwindClasses: "font-medium text-slate-800",
                      props: { text: "—" }
                    }
                  ]
                },
                {
                  name: "ResultRoleRow",
                  purpose: "Role field",
                  tailwindClasses: "flex justify-between gap-2 text-sm",
                  children: [
                    {
                      name: "LabelRole",
                      purpose: "Label",
                      tailwindClasses: "text-slate-500",
                      props: { text: "Role" }
                    },
                    {
                      name: "ValueRole",
                      purpose: "Placeholder value",
                      tailwindClasses: "font-medium text-slate-800",
                      props: { text: "—" }
                    }
                  ]
                },
                {
                  name: "ResultDeptRow",
                  purpose: "Department field",
                  tailwindClasses: "flex justify-between gap-2 text-sm",
                  children: [
                    {
                      name: "LabelDept",
                      purpose: "Label",
                      tailwindClasses: "text-slate-500",
                      props: { text: "Department" }
                    },
                    {
                      name: "ValueDept",
                      purpose: "Placeholder value",
                      tailwindClasses: "font-medium text-slate-800",
                      props: { text: "—" }
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    };
  }

  if (employeeMetricChartKind) {
    const isSalary = employeeMetricChartKind === "salary";
    const pageName = isSalary ? "CompensationAnalyticsPage" : "StressAnalyticsPage";
    const purpose = isSalary
      ? "Chart: salary band vs number of employees"
      : "Chart: stress level vs number of employees";
    const title = isSalary ? "Employee salary vs. headcount" : "Employee stress vs. headcount";
    const subtitle = isSalary
      ? "Bar chart: salary band (x) vs. number of employees in that band (y). Use Recharts BarChart in implementation."
      : "Bar chart: stress band (x) vs. number of employees in that band (y). Use Recharts BarChart in implementation.";

    return {
      name: pageName,
      purpose,
      tailwindClasses: "p-6 max-w-4xl mx-auto space-y-4",
      children: [
        {
          name: "ChartHeader",
          purpose: "Titles",
          tailwindClasses: "space-y-1",
          children: [
            {
              name: "ChartTitle",
              purpose: "Main title",
              tailwindClasses: "text-xl font-bold text-slate-900",
              props: { text: title }
            },
            {
              name: "ChartSubtitle",
              purpose: "Description",
              tailwindClasses: "text-sm text-slate-600",
              props: { text: subtitle }
            }
          ]
        },
        {
          name: "ChartCard",
          purpose: "Chart container",
          tailwindClasses:
            "rounded-xl border border-slate-200 bg-white p-4 shadow-sm min-h-[320px]",
          children: [
            {
              name: "ChartLegendNote",
              purpose: "Implementation hint",
              tailwindClasses: "text-xs text-slate-500",
              props: {
                text: "Data: [{ level, employees }, …]. Integrate ResponsiveContainer + BarChart from recharts."
              }
            }
          ]
        }
      ]
    };
  }

  const isTaskApp =
    /task|todo|taskflow|task management|checklist/i.test(prdText) &&
    !isLoginIntent &&
    !isSignupIntent &&
    !isEmployeeLookupForm &&
    !employeeMetricChartKind &&
    !(isButtonIntent && !isPageIntent);

  if (isTaskApp) {
    const { title: screenTitle, subtitle: boardSubtitle } = extractDisplayHeader(prdText);
    const coreLines = extractCoreFeatureLines(prdText);
    const defaultTasks = [
      { title: "Dashboard – View tasks and summary", status: "Active" as const },
      { title: "Add Task – Create new tasks", status: "Active" as const },
      { title: "Task List – Display tasks with status", status: "Active" as const },
      { title: "Task Actions – Edit, delete, mark complete", status: "Active" as const },
      { title: "Filters – All, Active, Completed", status: "Active" as const },
      { title: "Search – Search tasks", status: "Completed" as const }
    ];
    const taskItems =
      coreLines.length > 0
        ? coreLines.slice(0, 8).map((t, i) => ({
            title: t.length > 56 ? `${t.slice(0, 53)}…` : t,
            status: (i % 4 === 3 ? "Completed" : "Active") as "Active" | "Completed"
          }))
        : defaultTasks;

    return {
      name: "TaskManagerPage",
      purpose: "Task management dashboard aligned to PRD",
      tailwindClasses: "",
      children: [
        {
          name: "TaskBoard",
          purpose: "Main task column",
          tailwindClasses: "mx-auto max-w-2xl space-y-4",
          children: [
            {
              name: "BoardTitle",
              purpose: "Product name only",
              tailwindClasses: "text-lg font-bold tracking-tight text-slate-900",
              props: { text: screenTitle || "App" }
            },
            {
              name: "BoardSubtitle",
              purpose: "Section subtitle",
              tailwindClasses: "text-xs text-slate-500",
              props: { text: boardSubtitle }
            },
            {
              name: "SearchRow",
              purpose: "Search tasks",
              tailwindClasses: "w-full",
              children: [
                {
                  name: "SearchInput",
                  purpose: "Filter task list",
                  tailwindClasses:
                    "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100",
                  props: { placeholder: "Search tasks…" }
                }
              ]
            },
            {
              name: "TaskInputRow",
              purpose: "Create task",
              tailwindClasses: "flex flex-col gap-2 sm:flex-row sm:items-stretch",
              children: [
                {
                  name: "TaskInput",
                  purpose: "New task field",
                  tailwindClasses:
                    "w-full flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm shadow-sm outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100",
                  props: { placeholder: "Add a new task…" }
                },
                {
                  name: "AddTaskButton",
                  purpose: "Submit new task",
                  tailwindClasses:
                    "shrink-0 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700",
                  props: { text: "Add Task" }
                }
              ]
            },
            {
              name: "TaskFilter",
              purpose: "Status filters",
              tailwindClasses: "flex flex-wrap gap-2",
              children: [
                {
                  name: "FilterChip",
                  purpose: "All tasks",
                  tailwindClasses:
                    "rounded-full bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm",
                  props: { text: "All" }
                },
                {
                  name: "FilterChip",
                  purpose: "Active tasks",
                  tailwindClasses:
                    "rounded-full bg-white px-4 py-1.5 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-slate-200/90",
                  props: { text: "Active" }
                },
                {
                  name: "FilterChip",
                  purpose: "Done tasks",
                  tailwindClasses:
                    "rounded-full bg-white px-4 py-1.5 text-xs font-medium text-slate-600 shadow-sm ring-1 ring-slate-200/90",
                  props: { text: "Completed" }
                }
              ]
            },
            {
              name: "TaskList",
              purpose: "Task rows from requirements",
              tailwindClasses: "space-y-2",
              children: taskItems.map((item) => ({
                name: "TaskRow",
                purpose: "Single task",
                tailwindClasses:
                  "flex items-center gap-3 rounded-xl border border-slate-200/90 bg-white px-3 py-3 shadow-sm",
                children: [
                  {
                    name: "CheckboxDecor",
                    purpose: "Completion indicator",
                    tailwindClasses:
                      item.status === "Completed"
                        ? "h-4 w-4 shrink-0 rounded border-2 border-blue-500 bg-blue-500 shadow-inner"
                        : "h-4 w-4 shrink-0 rounded border-2 border-slate-300 bg-white"
                  },
                  {
                    name: "TaskLabel",
                    purpose: "Task title",
                    tailwindClasses:
                      item.status === "Completed"
                        ? "flex-1 text-sm text-slate-400 line-through"
                        : "flex-1 text-sm font-medium text-slate-800",
                    props: { text: item.title }
                  },
                  {
                    name: "StatusBadge",
                    purpose: "Status pill",
                    tailwindClasses:
                      item.status === "Completed"
                        ? "rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200/90"
                        : "rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600 ring-1 ring-slate-200/90",
                    props: { text: item.status }
                  },
                  {
                    name: "TaskActions",
                    purpose: "View, edit, complete, delete (icon buttons in live preview)",
                    tailwindClasses: "flex shrink-0 flex-wrap items-center gap-1",
                    children: [
                      {
                        name: "ViewTaskButton",
                        purpose: "View task details",
                        tailwindClasses:
                          "inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200",
                        props: { text: "View" }
                      },
                      {
                        name: "EditTaskButton",
                        purpose: "Edit task",
                        tailwindClasses:
                          "inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200",
                        props: { text: "Edit" }
                      },
                      {
                        name: "CompleteTaskButton",
                        purpose: "Toggle complete",
                        tailwindClasses:
                          "inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200",
                        props: { text: item.status === "Completed" ? "Undo" : "Done" }
                      },
                      {
                        name: "DeleteTaskButton",
                        purpose: "Remove task",
                        tailwindClasses:
                          "inline-flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 ring-1 ring-red-200/80 hover:bg-red-100",
                        props: { text: "Delete" }
                      }
                    ]
                  }
                ]
              }))
            }
          ]
        }
      ]
    };
  }

  return {
    name: pageName,
    purpose: "Main generated page based on provided requirements",
    tailwindClasses: "min-h-screen bg-slate-100 p-8",
    children: [
      {
        name: "Container",
        purpose: "Centers and constrains content width",
        tailwindClasses: "mx-auto max-w-5xl rounded-xl bg-white p-6 shadow-lg",
        children: [
          {
            name: "Header",
            purpose: "Page heading and context",
            tailwindClasses: "mb-6 border-b border-slate-200 pb-4",
            children: [
              {
                name: "Title",
                purpose: "Primary heading",
                tailwindClasses: "text-2xl font-bold text-slate-900",
                props: { text: appTitle }
              },
              {
                name: "Subtitle",
                purpose: "Fallback mode explanation",
                tailwindClasses: "mt-1 text-sm text-slate-500",
                props: {
                  text: "Rule-based preview generated without OpenAI API key."
                }
              }
            ]
          },
          ...(hasCreate
            ? [
                {
                  name: "Controls",
                  purpose: "Input and action row",
                  tailwindClasses: "mb-4 flex gap-3",
                  children: [
                    {
                      name: "PrimaryInput",
                      purpose: "Primary create input",
                      tailwindClasses:
                        "w-full rounded-md border border-slate-300 px-3 py-2 text-sm",
                      props: { placeholder: "Add item..." }
                    },
                    {
                      name: "PrimaryButton",
                      purpose: "Primary submit action",
                      tailwindClasses:
                        "rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700",
                      props: { text: "Add" }
                    }
                  ]
                } as UIComponentNode
              ]
            : []),
          ...(hasFilter
            ? [
                {
                  name: "FilterBar",
                  purpose: "Quick filtering controls",
                  tailwindClasses: "mb-4 flex gap-2",
                  children: [
                    {
                      name: "FilterChip",
                      purpose: "Filter option",
                      tailwindClasses:
                        "rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700",
                      props: { text: "All" }
                    },
                    {
                      name: "FilterChip",
                      purpose: "Filter option",
                      tailwindClasses:
                        "rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700",
                      props: { text: "Filtered" }
                    }
                  ]
                } as UIComponentNode
              ]
            : []),
          {
            name: "FeatureList",
            purpose: "Visualized requirements list",
            tailwindClasses: "space-y-2",
            children: displayFeatures.map((feature) => ({
              name: "FeatureItem",
              purpose: "Single requirement row",
              tailwindClasses:
                "rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700",
              props: { text: feature }
            }))
          }
        ]
      }
    ]
  };
}

function nodeToJsx(node: UIComponentNode, depth = 2): string {
  const indent = "  ".repeat(depth);
  const textValue =
    typeof node.props?.text === "string" ? String(node.props.text) : node.name;
  const classes = node.tailwindClasses || "";
  const children = node.children ?? [];

  if (children.length === 0) {
    if (/button/i.test(node.name)) {
      return `${indent}<button className="${classes}">${textValue}</button>`;
    }
    if (/input/i.test(node.name)) {
      const placeholder =
        typeof node.props?.placeholder === "string"
          ? String(node.props.placeholder)
          : "Enter value";
      const inputType = /password/i.test(node.name) ? "password" : "text";
      return `${indent}<input type="${inputType}" className="${classes}" placeholder="${placeholder}" />`;
    }
    if (/checkbox/i.test(node.name)) {
      return `${indent}<input type="checkbox" className="${classes}" readOnly />`;
    }
    return `${indent}<div className="${classes}">${textValue}</div>`;
  }

  const childJsx = children.map((child) => nodeToJsx(child, depth + 1)).join("\n");
  return `${indent}<div className="${classes}">\n${childJsx}\n${indent}</div>`;
}

export function buildReactCode(tree: UIComponentNode): string {
  return [
    "export default function GeneratedUI() {",
    "  return (",
    nodeToJsx(tree),
    "  );",
    "}"
  ].join("\n");
}

export function buildUserPrompt(prdText: string): string {
  return `
Product requirements document:
${prdText}

Return the JSON only.
`;
}

function buildFallbackResult(prdText: string, reason: string): UIGenerationResult {
  const fallbackTree = buildRuleBasedFallbackTree(prdText);
  const pageName = toPageName(prdText);
  const isSignup = /account\s*creation|create\s+account|sign\s*up|signup|register|registration|new\s+user|join\s+now/i.test(
    prdText
  );
  const isLogin =
    /login|log in|sign in|signin|authentication|auth\b/i.test(prdText) && !isSignup;
  const isEmployee =
    /employee|staff|\bhr\b/i.test(prdText) &&
    /form|fetch|lookup|details?|retrieve|search|find/i.test(prdText) &&
    !/task\s+(management|list|board)|\btodo\b|taskflow/i.test(prdText);
  const employeeMetricChart = parseEmployeeMetricChartIntent(prdText);
  const isTask =
    /task|todo|taskflow|task management|checklist/i.test(prdText) &&
    !isLogin &&
    !isSignup &&
    !isEmployee &&
    !employeeMetricChart;
  const product = extractProductName(prdText);
  const appName = isTask && product
    ? product
    : isSignup && product
      ? product
      : isSignup
        ? "Sign up"
        : isEmployee
          ? "Employee lookup"
          : employeeMetricChart === "salary"
            ? "Salary analytics"
            : employeeMetricChart === "stress"
              ? "Stress analytics"
              : toDisplayTitleFromPageName(pageName) || "AI UI Builder";
  return {
    appName,
    description: `Dynamic fallback output (${reason}): generated from requirements using local rules.`,
    componentTree: fallbackTree,
    generatedCode: buildReactCode(fallbackTree)
  };
}

function extractJsonPayload(raw: string): string {
  let text = raw.trim();
  const fence = /```(?:json)?\s*\n?([\s\S]*?)```/i.exec(text);
  if (fence) {
    return fence[1].trim();
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) {
    return text.slice(start, end + 1).trim();
  }
  return text;
}

function parseUIGenerationJson(
  raw: string
): Omit<UIGenerationResult, "generatedCode"> | null {
  try {
    const payload = extractJsonPayload(raw);
    const parsed = JSON.parse(payload) as Omit<UIGenerationResult, "generatedCode">;
    if (!parsed?.componentTree || typeof parsed.componentTree.name !== "string") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

type LlmProvider = "anthropic" | "openai";

function resolveLlmProvider(): LlmProvider | null {
  const explicit = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (explicit === "anthropic" || explicit === "claude") return "anthropic";
  if (explicit === "openai") return "openai";
  if (process.env.ANTHROPIC_API_KEY?.trim()) return "anthropic";
  if (process.env.OPENAI_API_KEY?.trim()) return "openai";
  return null;
}

async function generateWithAnthropic(
  prdText: string,
  apiKey: string
): Promise<UIGenerationResult | null> {
  const model =
    process.env.CLAUDE_MODEL?.trim() || "claude-3-5-sonnet-20241022";
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model,
      max_tokens: 8192,
      temperature: 0.2,
      system: systemPrompt.trim(),
      messages: [{ role: "user", content: buildUserPrompt(prdText) }]
    })
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const rawContent = data.content?.find((b) => b.type === "text")?.text;
  if (!rawContent) {
    return null;
  }

  const parsed = parseUIGenerationJson(rawContent);
  if (!parsed) {
    return null;
  }
  return {
    ...parsed,
    generatedCode: buildReactCode(parsed.componentTree)
  };
}

async function generateWithOpenAI(
  prdText: string,
  apiKey: string
): Promise<UIGenerationResult | null> {
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: buildUserPrompt(prdText) }
      ]
    })
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  const rawContent = data.choices?.[0]?.message?.content as string | undefined;
  if (!rawContent) {
    return null;
  }

  const parsed = parseUIGenerationJson(rawContent);
  if (!parsed) {
    return null;
  }
  return {
    ...parsed,
    generatedCode: buildReactCode(parsed.componentTree)
  };
}

/**
 * UI source:
 * - **AI**: `ANTHROPIC_API_KEY` (Claude) or `OPENAI_API_KEY` — see `AI_PROVIDER` in `.env.example`.
 * - **Predefined (local rules)**: No key, HTTP error, bad JSON, or empty model output → `buildRuleBasedFallbackTree`.
 */
export async function generateFromPRD(prdText: string): Promise<UIGenerationResult> {
  const provider = resolveLlmProvider();
  if (!provider) {
    return buildFallbackResult(prdText, "no AI API key configured");
  }

  try {
    if (provider === "anthropic") {
      const key = process.env.ANTHROPIC_API_KEY?.trim();
      if (!key) {
        return buildFallbackResult(prdText, "ANTHROPIC_API_KEY missing");
      }
      const out = await generateWithAnthropic(prdText, key);
      if (out) return out;
      return buildFallbackResult(prdText, "Claude request failed or returned invalid JSON");
    }

    const key = process.env.OPENAI_API_KEY?.trim();
    if (!key) {
      return buildFallbackResult(prdText, "OPENAI_API_KEY missing");
    }
    const out = await generateWithOpenAI(prdText, key);
    if (out) return out;
    return buildFallbackResult(
      prdText,
      "OpenAI request failed or returned invalid JSON"
    );
  } catch (error) {
    return buildFallbackResult(
      prdText,
      `AI request exception: ${(error as Error).message || "unknown error"}`
    );
  }
}
