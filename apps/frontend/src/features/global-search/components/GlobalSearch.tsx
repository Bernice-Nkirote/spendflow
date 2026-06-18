import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { searchGlobal } from "../api/globalSearchApi";
import type {
  GlobalSearchItem,
  GlobalSearchResponse,
} from "../types/globalSearch.types";

type GlobalSearchProps = {
  placeholder?: string;
  variant?: "inline" | "overlay";
};

const emptySearchResults: GlobalSearchResponse = {
  purchase_requisitions: [],
  purchase_orders: [],
  invoices: [],
  payments: [],
  suppliers: [],
  users: [],
  permissions: [],
  audit_logs: [],
  help: [],
};

const searchGroups: {
  key: keyof GlobalSearchResponse;
  label: string;
}[] = [
  { key: "purchase_requisitions", label: "Purchase Requisitions" },
  { key: "purchase_orders", label: "Purchase Orders" },
  { key: "invoices", label: "Invoices" },
  { key: "payments", label: "Payments" },
  { key: "suppliers", label: "Suppliers" },
  { key: "users", label: "Users" },
  { key: "permissions", label: "Permissions" },
  { key: "audit_logs", label: "Audit Logs" },
  { key: "help", label: "Help & Guidance" },
];

const helpSearchItems: GlobalSearchItem[] = [
  {
    entity_type: "help",
    entity_id: "assistant",
    title: "Ask Tenda Assistant",
    subtitle: "Get a clear next step when you are stuck or unsure what to do.",
    status: "Help",
    route: "/assistant",
  },
  {
    entity_type: "help",
    entity_id: "user-guide",
    title: "Open the User Guide",
    subtitle: "Read detailed guidance for setup, suppliers, PRs, POs, invoices, payments, approvals, reports, and the supplier portal.",
    status: "Guide",
    route: "/user-guide",
  },
  {
    entity_type: "help",
    entity_id: "approval-workflows-guide",
    title: "Approval workflow help",
    subtitle: "Learn how approval levels, roles, partner approvals, tasks, and notifications fit together.",
    status: "Guide",
    route: "/user-guide",
  },
  {
    entity_type: "help",
    entity_id: "supplier-portal-guide",
    title: "Supplier portal help",
    subtitle: "Find guidance on creating supplier portal users and supplier access.",
    status: "Guide",
    route: "/user-guide",
  },
  {
    entity_type: "help",
    entity_id: "roles-permissions-guide",
    title: "Roles and permissions help",
    subtitle: "Understand roles, permission assigning, departments, and who can create or approve records.",
    status: "Guide",
    route: "/user-guide",
  },
];

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20L16.65 16.65" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6L6 18" />
      <path d="M6 6L18 18" />
    </svg>
  );
}

function hasSearchResults(results: GlobalSearchResponse) {
  return searchGroups.some((group) => results[group.key].length > 0);
}

function getHelpSearchResults(query: string) {
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery.length < 2) return [];

  const helpWords = [
    "help",
    "guide",
    "confused",
    "stuck",
    "lost",
    "how",
    "what",
    "where",
    "start",
    "assistant",
    "tenda",
    "approval",
    "workflow",
    "task",
    "notification",
    "supplier portal",
    "roles",
    "permissions",
    "department",
    "setup",
  ];

  const shouldShowPrimaryHelp = helpWords.some((word) =>
    normalizedQuery.includes(word),
  );

  return helpSearchItems.filter((item, index) => {
    const searchableText = [
      item.title,
      item.subtitle,
      item.status,
      item.entity_id,
    ]
      .join(" ")
      .toLowerCase();

    return (
      searchableText.includes(normalizedQuery) ||
      (shouldShowPrimaryHelp && index < 2)
    );
  });
}

function GlobalSearch({
  placeholder = "Search PRs, POs, invoices, payments, suppliers, users...",
  variant = "inline",
}: GlobalSearchProps) {
  const searchRef = useRef<HTMLDivElement | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] =
    useState<GlobalSearchResponse>(emptySearchResults);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const isOverlay = variant === "overlay";

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        !isOverlay &&
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);

        if (!searchQuery.trim()) {
          setSearchResults(emptySearchResults);
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOverlay, searchQuery]);

  useEffect(() => {
    const normalizedQuery = searchQuery.trim();

    if (normalizedQuery.length < 2) {
      setSearchResults(emptySearchResults);
      setSearchLoading(false);
      return;
    }

    let isActive = true;

    const timeoutId = window.setTimeout(async () => {
      try {
        setSearchLoading(true);

        const results = await searchGlobal(normalizedQuery, 5);
        const help = getHelpSearchResults(normalizedQuery);

        if (isActive) {
          setSearchResults({ ...results, help });
          setIsSearchOpen(true);
        }
      } catch {
        if (isActive) {
          setSearchResults({
            ...emptySearchResults,
            help: getHelpSearchResults(normalizedQuery),
          });
        }
      } finally {
        if (isActive) {
          setSearchLoading(false);
        }
      }
    }, 300);

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  function handleClearSearch() {
    setSearchQuery("");
    setSearchResults(emptySearchResults);
  }

  function handleCloseSearch() {
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults(emptySearchResults);
  }

  function handleResultClick() {
    handleCloseSearch();
  }

  function renderResults() {
    if (searchLoading) {
      return (
        <p className="rounded-xl bg-gray-50 px-3 py-3 text-sm text-primary-gray">
          Searching...
        </p>
      );
    }

    if (!hasSearchResults(searchResults)) {
      return (
        <p className="rounded-xl bg-gray-50 px-3 py-3 text-sm text-primary-gray">
          No matching results found.
        </p>
      );
    }

    return (
      <div className="max-h-[420px] space-y-4 overflow-y-auto pr-1 [scrollbar-width:thin] [scrollbar-color:rgba(39,76,119,0.35)_transparent]">
        {searchGroups.map((group) => {
          const items = searchResults[group.key];

          if (items.length === 0) return null;

          return (
            <div key={group.key}>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary-blue">
                {group.label}
              </p>

              <div className="space-y-2">
                {items.map((item: GlobalSearchItem) => (
                  <Link
                    key={`${item.entity_type}-${item.entity_id}`}
                    to={item.route}
                    onClick={handleResultClick}
                    className="block rounded-2xl border border-gray-200 bg-white p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-blue/20 hover:bg-blue-50/30 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-primary-black">
                          {item.title}
                        </p>

                        {item.subtitle && (
                          <p className="mt-1 truncate text-xs text-primary-gray">
                            {item.subtitle}
                          </p>
                        )}
                      </div>

                      {item.status && (
                        <span className="shrink-0 rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-primary-blue">
                          {item.status}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  if (isOverlay) {
    return (
      <>
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-white text-primary-blue shadow-sm transition hover:bg-blue-50 hover:shadow-md"
          aria-label="Open global search"
        >
          <SearchIcon />
        </button>

        {isSearchOpen && (
          <div className="fixed inset-0 z-[80] bg-gradient-to-b from-[#E7ECEF]/55 via-[#DCE7F5]/45 to-[#C9DBF5]/55 px-3 pt-4 backdrop-blur-md">
            <div className="mx-auto w-full max-w-md rounded-3xl border border-white/70 bg-white/90 p-3 shadow-[0_20px_45px_rgba(39,76,119,0.18)] backdrop-blur-xl">
              <div className="flex h-12 items-center rounded-2xl border border-[#D7E3F4] bg-white/95 px-3 shadow-[0_8px_24px_rgba(39,76,119,0.14)] backdrop-blur-lg">
                <span className="mr-3 shrink-0 text-primary-blue">
                  <SearchIcon />
                </span>

                <input
                  type="text"
                  name="mobileGlobalSearch"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  autoFocus
                  placeholder={placeholder}
                  className="h-full min-w-0 flex-1 bg-transparent text-sm text-primary-black outline-none placeholder:text-primary-blue/45"
                />

                {searchQuery ? (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-primary-blue transition hover:bg-blue-50"
                    aria-label="Clear search"
                  >
                    <CloseIcon />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCloseSearch}
                    className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-primary-blue transition hover:bg-blue-50"
                    aria-label="Close search"
                  >
                    <CloseIcon />
                  </button>
                )}
              </div>

              {searchQuery.trim().length >= 2 && (
                <div className="mt-3 max-h-[70vh] overflow-y-auto rounded-2xl border border-[#D7E3F4] bg-white/95 p-3 shadow-sm [scrollbar-width:thin] [scrollbar-color:rgba(39,76,119,0.35)_transparent]">
                  {renderResults()}
                </div>
              )}
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div ref={searchRef} className="relative shrink-0">
      <div
        className={`flex items-center rounded-full border border-blue-100 bg-white shadow-lg shadow-blue-100/50 transition-all duration-300 ease-out ${
          isSearchOpen ? "w-[320px]" : "w-11"
        }`}
      >
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-primary-blue transition hover:bg-blue-50"
          aria-label="Open global search"
        >
          <SearchIcon />
        </button>

        {isSearchOpen && (
          <>
            <input
              type="text"
              name="globalSearch"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              autoFocus
              placeholder={placeholder}
              className="h-11 min-w-0 flex-1 bg-transparent px-0 text-sm text-primary-black outline-none placeholder:text-primary-blue/45"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="mr-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-primary-blue transition hover:bg-blue-50"
                aria-label="Clear search"
              >
                <CloseIcon />
              </button>
            )}
          </>
        )}
      </div>

      {isSearchOpen && searchQuery.trim().length >= 2 && (
        <div className="absolute right-0 top-14 z-50 w-[360px] rounded-3xl border border-gray-200 bg-white p-4 shadow-xl">
          {renderResults()}
        </div>
      )}
    </div>
  );
}

export default GlobalSearch;
