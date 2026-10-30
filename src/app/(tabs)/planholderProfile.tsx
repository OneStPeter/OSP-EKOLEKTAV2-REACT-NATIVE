import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import {
  Briefcase,
  Building2,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  CreditCard,
  Ellipsis,
  FileText,
  HandCoins,
  Hash,
  History,
  MapPin,
  MapPinned,
  Phone,
  RefreshCw,
  Replace,
  Search,
  Trash2,
  TrendingUpDown,
  User,
  UserPen,
  Users,
  X,
} from "lucide-react-native";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { APP_HEADER_HEIGHT } from "@/components/navigation/AppHeader";
import { BOTTOM_NAV_HEIGHT } from "@/components/navigation/BottomNavBar";
import {
  AlertModal,
  AppButton,
  Badge,
  BRAND_COLORS,
  Card,
  EmptyState,
  IconBox,
  InfoRow,
  palette,
  RowItem,
  SwipeDismissModal,
  theme,
  useAlertModal,
  type InfoRowIcon,
} from "@/components/ui";
import { useNav } from "@/context/nav-context";
import {
  findAddress,
  findContact,
  headlinePlan,
  pendingRequests,
  planholderInitials,
  planholderName,
  PLANHOLDERS,
  primaryPhone,
  type PlanDetail,
  type Planholder,
  type PlanholderRequest,
  type PlanStatus,
  type RequestStatus,
} from "@/data/planholder";
import { useScrollNav } from "@/hooks/use-scroll-nav";

// ── Static styling maps ──────────────────────────────────────────────────────

const PLAN_STATUS_STYLES: Record<PlanStatus, { color: string; bg: string }> = {
  Active: { color: theme.color.accent, bg: theme.color.successBg },
  Lapsed: { color: palette.warningText, bg: theme.color.warningBg },
  Terminated: { color: theme.color.error, bg: theme.color.errorBg },
};

const REQUEST_STATUS_STYLES: Record<
  RequestStatus,
  { color: string; bg: string }
> = {
  Pending: { color: palette.gold, bg: palette.paleGold + "55" },
  Approved: { color: theme.color.accent, bg: theme.color.successBg },
  Denied: { color: theme.color.error, bg: theme.color.errorBg },
};

/** Space between adjacent carousel slides — the cards themselves stay
 *  full-width, so the gap only shows while the pager is being swiped. */
const CAROUSEL_GAP = 12;

const REQUEST_ICONS: Record<string, InfoRowIcon> = {
  Reinstatement: RefreshCw,
  "Change of Mode": Replace,
  "Returned of Premium": TrendingUpDown,
  "Transfer of Rights": Users,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtPeso(n: number) {
  return (
    "₱" +
    n.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
  );
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString([], {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/** Snap-carousel plumbing shared by the plans and requests pagers. */
function useCarousel(count: number, snapWidth: number) {
  const ref = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  function onMomentumScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = Math.round(e.nativeEvent.contentOffset.x / snapWidth);
    setIndex(Math.max(0, Math.min(count - 1, next)));
  }

  function scrollTo(next: number) {
    const clamped = Math.max(0, Math.min(count - 1, next));
    setIndex(clamped);
    ref.current?.scrollTo({ x: clamped * snapWidth, animated: true });
  }

  function reset() {
    setIndex(0);
    ref.current?.scrollTo({ x: 0, animated: false });
  }

  return { ref, index, onMomentumScrollEnd, scrollTo, reset };
}

// ── Building blocks ──────────────────────────────────────────────────────────

/** Coloured status dot followed by its pill — used on cards and headers. */
function StatusPill({
  label,
  color,
  bg,
}: {
  label: string;
  color: string;
  bg: string;
}) {
  return (
    <View style={s.statusPill}>
      <View style={[s.statusDot, { backgroundColor: color }]} />
      <Badge label={label} color={color} backgroundColor={bg} />
    </View>
  );
}

function Chip({
  icon: Icon,
  label,
  color = theme.color.body,
  bg = BRAND_COLORS.subtleBg,
  iconColor,
}: {
  icon: InfoRowIcon;
  label: string;
  color?: string;
  bg?: string;
  iconColor?: string;
}) {
  return (
    <View style={[s.chip, { backgroundColor: bg }]}>
      <Icon size={11} color={iconColor ?? color} strokeWidth={2.2} />
      <Text style={[s.chipText, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/** Dots + arrows pager control, matching the home-screen KPI carousel. */
function Pager({
  count,
  index,
  onChange,
}: {
  count: number;
  index: number;
  onChange: (next: number) => void;
}) {
  if (count < 2) return null;
  return (
    <View style={s.pagerRow}>
      <TouchableOpacity
        onPress={() => onChange(index - 1)}
        style={s.pagerArrow}
        activeOpacity={0.7}
        disabled={index === 0}
        accessibilityRole="button"
        accessibilityLabel="Previous"
      >
        <ChevronLeft
          size={16}
          color={index === 0 ? theme.color.dots : theme.color.accent}
          strokeWidth={2.5}
        />
      </TouchableOpacity>

      <View style={s.pagerDots}>
        {Array.from({ length: count }, (_, i) => (
          <View key={i} style={[s.pagerDot, index === i && s.pagerDotActive]} />
        ))}
      </View>

      <TouchableOpacity
        onPress={() => onChange(index + 1)}
        style={s.pagerArrow}
        activeOpacity={0.7}
        disabled={index === count - 1}
        accessibilityRole="button"
        accessibilityLabel="Next"
      >
        <ChevronRight
          size={16}
          color={index === count - 1 ? theme.color.dots : theme.color.accent}
          strokeWidth={2.5}
        />
      </TouchableOpacity>
    </View>
  );
}

/** Accordion card used by the four information sections. */
function CollapsibleSection({
  icon: Icon,
  title,
  subtitle,
  open,
  onToggle,
  children,
}: {
  icon: InfoRowIcon;
  title: string;
  subtitle: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={s.section}>
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.8}
        style={s.sectionHeader}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={title}
      >
        <View style={s.sectionIcon}>
          <Icon size={16} color={theme.color.body} strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.sectionTitle}>{title}</Text>
          <Text style={s.sectionSubtitle}>{subtitle}</Text>
        </View>
        {open ? (
          <ChevronUp size={18} color={theme.color.muted} strokeWidth={2} />
        ) : (
          <ChevronDown size={18} color={theme.color.muted} strokeWidth={2} />
        )}
      </TouchableOpacity>
      {open ? <View style={s.sectionBody}>{children}</View> : null}
    </View>
  );
}

/** Full-bleed gradient plan card shown in the plans carousel. */
function PlanCard({
  plan,
  width,
  onViewDetails,
}: {
  plan: PlanDetail;
  width: number;
  onViewDetails: () => void;
}) {
  const status = PLAN_STATUS_STYLES[plan.status];
  return (
    <LinearGradient
      colors={[BRAND_COLORS.primaryGreen, BRAND_COLORS.darkGreen] as const}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={[s.planCard, { width }]}
    >
      {/* Decorative corner disc */}
      <View style={s.planCardDisc} pointerEvents="none" />

      <View style={s.planCardTop}>
        <View style={{ flex: 1 }}>
          <Text style={s.planCardLabel}>LPA NUMBER</Text>
          <Text style={s.planCardLpa} numberOfLines={1}>
            {plan.lpaNumber}
          </Text>
        </View>
        <Badge
          label={plan.status.toUpperCase()}
          color="#fff"
          backgroundColor={
            plan.status === "Active" ? "rgba(255,255,255,0.28)" : status.color
          }
        />
      </View>

      <Text style={s.planCardName} numberOfLines={1}>
        {plan.planName}
      </Text>

      <View style={s.planCardMeta}>
        {[
          { label: "MODE", value: plan.mode.toUpperCase() },
          { label: "TERM", value: plan.term },
          { label: "BRANCH", value: plan.branch.toUpperCase() },
        ].map((m) => (
          <View key={m.label} style={s.planCardMetaCell}>
            <Text style={s.planCardLabel}>{m.label}</Text>
            <Text style={s.planCardMetaValue} numberOfLines={1}>
              {m.value}
            </Text>
          </View>
        ))}
      </View>

      <View style={s.planCardDivider} />

      <View style={s.planCardRow}>
        <Text style={s.planCardPaid}>
          {plan.installmentsPaid} OF {plan.installmentsTotal} PAID
        </Text>
        <Text style={s.planCardDue}>
          DUE: <Text style={s.planCardDueValue}>{plan.dueDate}</Text>
        </Text>
      </View>

      <View style={s.planCardFooter}>
        <View style={{ flex: 1 }}>
          <Text style={s.planCardLabel}>AMOUNT DUE</Text>
          <Text style={s.planCardAmount}>{fmtPeso(plan.amountDue)}</Text>
        </View>
        <TouchableOpacity
          onPress={onViewDetails}
          activeOpacity={0.85}
          style={s.planCardBtn}
        >
          <Text style={s.planCardBtnText}>View Details</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

/** One request tile inside the Pending Request(s) pager. */
function RequestCard({
  request,
  width,
  onPress,
}: {
  request: PlanholderRequest;
  width: number;
  onPress: () => void;
}) {
  const status = REQUEST_STATUS_STYLES[request.status];
  const Icon = REQUEST_ICONS[request.type] ?? FileText;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[s.requestCard, { width }]}
    >
      <View style={s.requestTop}>
        <IconBox icon={Icon} color={theme.color.accent} size={32} />
        <View style={{ flex: 1 }}>
          <Text style={s.requestTitle} numberOfLines={1}>
            {request.title}
          </Text>
          <Text style={s.requestDesc} numberOfLines={1}>
            {request.description}
          </Text>
        </View>
        <StatusPill
          label={request.status}
          color={status.color}
          bg={status.bg}
        />
      </View>

      {/* Progress track — one node per step, filled up to the current one. */}
      <View style={s.progressRow}>
        <View style={s.progressTrack}>
          {Array.from({ length: request.totalSteps }, (_, i) => (
            <React.Fragment key={i}>
              {i > 0 && (
                <View
                  style={[
                    s.progressLine,
                    i <= request.currentStep - 1 && s.progressLineDone,
                  ]}
                />
              )}
              <View
                style={[
                  s.progressNode,
                  i <= request.currentStep - 1 && s.progressNodeDone,
                  i === request.currentStep - 1 && s.progressNodeActive,
                ]}
              />
            </React.Fragment>
          ))}
        </View>
        <Text style={s.progressText}>
          {request.currentStep} / {request.totalSteps} steps
        </Text>
      </View>

      <View style={s.requestMetaRow}>
        <Text style={s.requestDate}>{request.date}</Text>
        <View style={s.requestTxn}>
          <Text style={s.requestTxnText}>{request.transactionId}</Text>
          <ChevronRight size={12} color={theme.color.muted} />
        </View>
      </View>

      <View style={s.requestFooter}>
        <Text style={s.requestFooterHint}>Tap to track request</Text>
        <ChevronRight size={14} color={theme.color.muted} />
      </View>
    </TouchableOpacity>
  );
}

/** Vertical step timeline shown in the request tracker sheet. */
function RequestTimeline({ request }: { request: PlanholderRequest }) {
  return (
    <View style={s.timeline}>
      {request.steps.map((label, i) => {
        const done = i < request.currentStep;
        const active = i === request.currentStep - 1;
        return (
          <View key={label} style={s.timelineRow}>
            <View style={s.timelineRail}>
              <View
                style={[
                  s.timelineNode,
                  done && s.timelineNodeDone,
                  active && s.timelineNodeActive,
                ]}
              />
              {i < request.steps.length - 1 && (
                <View
                  style={[
                    s.timelineConnector,
                    i < request.currentStep - 1 && s.timelineConnectorDone,
                  ]}
                />
              )}
            </View>
            <View style={s.timelineBody}>
              <Text style={[s.timelineLabel, done && s.timelineLabelDone]}>
                {label}
              </Text>
              <Text style={s.timelineHint}>
                {done ? (active ? "In progress" : "Completed") : "Pending"}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────

type ViewMode = "list" | "detail";

type QuickAction = {
  label: string;
  icon: InfoRowIcon;
  destructive?: boolean;
};

const QUICK_ACTIONS: QuickAction[] = [
  { label: "Edit Planholder", icon: UserPen },
  { label: "Pay My Plan", icon: CreditCard },
  { label: "Change of Mode", icon: Replace },
  { label: "ROP Application", icon: TrendingUpDown },
  { label: "Claim Application", icon: FileText },
  { label: "Loan Application", icon: HandCoins },
  { label: "CSV Application", icon: Briefcase },
  { label: "Delete Planholder", icon: Trash2, destructive: true },
];

export default function PlanholderProfileScreen() {
  const scrollHandler = useScrollNav();
  const { setHeaderOverride } = useNav();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const padH = isTablet ? 24 : 16;
  const contentW = Math.min(width, 1024) - padH * 2;
  // Request tiles sit inside a Card (1px border + 14px padding per side).
  const requestW = contentW - 30;

  const [view, setView] = useState<ViewMode>("list");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const [personalOpen, setPersonalOpen] = useState(false);
  const [addressOpen, setAddressOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [employmentOpen, setEmploymentOpen] = useState(false);

  const [actionsOpen, setActionsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [planSheet, setPlanSheet] = useState<PlanDetail | null>(null);
  const [requestSheet, setRequestSheet] = useState<PlanholderRequest | null>(
    null,
  );
  const { alertState, showAlert, dismissAlert } = useAlertModal();

  const selected = useMemo(
    () => PLANHOLDERS.find((p) => p.personId === selectedId) ?? null,
    [selectedId],
  );

  const backToList = useCallback(() => setView("list"), []);
  const openActions = useCallback(() => setActionsOpen(true), []);

  // The AppHeader tracks the view: the list keeps the burger, the detail view
  // swaps it for a back chevron and mounts the "More" pill. Tabs mount eagerly,
  // so the override is only published while this screen is focused and is
  // cleared on blur, leaving other tabs with their own header.
  useFocusEffect(
    useCallback(() => {
      setHeaderOverride(
        view === "list"
          ? { subtitle: "Find a planholder to view their profile." }
          : {
              subtitle: "Clear access to every planholder detail.",
              onBack: backToList,
              action: { label: "More", icon: Ellipsis, onPress: openActions },
            },
      );
      return () => setHeaderOverride(null);
    }, [view, backToList, openActions, setHeaderOverride]),
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PLANHOLDERS;
    return PLANHOLDERS.filter((p) => {
      const haystack = [
        planholderName(p),
        p.personId,
        ...p.plans.map((plan) => plan.lpaNumber),
        ...p.plans.map((plan) => plan.planName),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [query]);

  const plans = selected?.plans ?? [];
  const pending = selected ? pendingRequests(selected) : [];

  const planCarousel = useCarousel(plans.length, contentW + CAROUSEL_GAP);
  const requestCarousel = useCarousel(
    pending.length,
    requestW + CAROUSEL_GAP,
  );

  function openPlanholder(p: Planholder) {
    setSelectedId(p.personId);
    setView("detail");
    setPersonalOpen(false);
    setAddressOpen(false);
    setContactOpen(false);
    setEmploymentOpen(false);
    planCarousel.reset();
    requestCarousel.reset();
  }

  function handleQuickAction(action: QuickAction) {
    setActionsOpen(false);
    if (action.destructive) {
      showAlert(
        "error",
        "Unable to delete planholder.",
        "Unable to delete planholder with active plans.",
      );
      return;
    }
    showAlert(
      "info",
      "Not Available",
      `${action.label} is currently not available.`,
    );
  }

  const residence = selected ? findAddress(selected, "RESIDENCE") : undefined;
  const office = selected ? findAddress(selected, "OFFICE") : undefined;

  return (
    <>
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={{ backgroundColor: theme.color.bg }}
        contentContainerStyle={[
          s.content,
          {
            paddingTop: APP_HEADER_HEIGHT + insets.top + 16,
            paddingBottom: BOTTOM_NAV_HEIGHT + insets.bottom + 16,
            paddingHorizontal: padH,
          },
          isTablet && s.contentTablet,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {view === "list" ? (
          <>
            {/* ── Search — same single-field treatment as LookupField ── */}
            <View style={s.searchField}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search by LPA Number, Name, or Person ID…"
                placeholderTextColor={theme.color.muted}
                style={s.searchInput}
                autoCorrect={false}
                returnKeyType="search"
                accessibilityLabel="Search planholders"
              />
              {query !== "" && (
                <TouchableOpacity
                  onPress={() => setQuery("")}
                  hitSlop={8}
                  style={s.searchClear}
                  accessibilityRole="button"
                  accessibilityLabel="Clear search"
                >
                  <X size={14} color={theme.color.muted} />
                </TouchableOpacity>
              )}
              <View style={s.searchIconBox}>
                <Search size={16} color="#fff" strokeWidth={2.5} />
              </View>
            </View>

            {/* ── Results ─────────────────────────────────────────── */}
            <View style={s.list}>
              {filtered.length === 0 ? (
                <EmptyState
                  icon={Search}
                  title="No planholders found"
                  message="Try a different LPA number, name, or person ID."
                />
              ) : (
                filtered.map((p) => {
                  const plan = headlinePlan(p);
                  const status =
                    PLAN_STATUS_STYLES[plan?.status ?? "Terminated"];
                  const phone = primaryPhone(p);
                  return (
                    <TouchableOpacity
                      key={p.personId}
                      activeOpacity={0.85}
                      onPress={() => openPlanholder(p)}
                      style={s.listCard}
                    >
                      <View style={s.listCardTop}>
                        <View style={s.listCardIcon}>
                          <User size={16} color={theme.color.body} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={s.listCardName} numberOfLines={1}>
                            {planholderName(p)}
                          </Text>
                          <Text style={s.listCardId}># {p.personId}</Text>
                        </View>
                        {plan && (
                          <StatusPill
                            label={plan.status}
                            color={status.color}
                            bg={status.bg}
                          />
                        )}
                      </View>

                      <View style={s.listCardChips}>
                        <Chip icon={Calendar} label={p.registeredDate} />
                        <Chip icon={MapPin} label={p.branchCode} />
                      </View>

                      {plan && (
                        <>
                          <InfoRow
                            icon={Hash}
                            label="LPA"
                            value={plan.lpaNumber}
                          />
                          <InfoRow
                            icon={User}
                            label="Plan"
                            value={plan.planName}
                          />
                        </>
                      )}

                      {phone && (
                        <View style={s.listCardPhone}>
                          <Chip
                            icon={Phone}
                            label={phone}
                            color={theme.color.info}
                            bg={theme.color.infoBg}
                            iconColor={palette.errorRed}
                          />
                        </View>
                      )}

                      <View style={s.listCardFooter}>
                        <Text style={s.listCardFooterHint}>
                          Tap to view profile
                        </Text>
                        <ChevronRight size={14} color={theme.color.muted} />
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          </>
        ) : !selected ? (
          <EmptyState
            icon={Search}
            title="No Planholder Selected"
            message="Use the search bar to find a planholder."
          />
        ) : (
          <>
            {/* Back and More live in the AppHeader — see the focus effect. */}

            {/* ── Identity card ───────────────────────────────────── */}
            <View style={s.identityCard}>
              <View style={s.identityTop}>
                <View style={s.avatar}>
                  <Text style={s.avatarText}>
                    {planholderInitials(selected).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.identityName} numberOfLines={1}>
                    {planholderName(selected)}
                  </Text>
                  <Text style={s.listCardId}># {selected.personId}</Text>
                </View>
                <StatusPill
                  label={selected.isInsurable ? "Insurable" : "Not Insurable"}
                  color={
                    selected.isInsurable
                      ? theme.color.accent
                      : theme.color.error
                  }
                  bg={
                    selected.isInsurable
                      ? theme.color.successBg
                      : theme.color.errorBg
                  }
                />
              </View>
              {primaryPhone(selected) && (
                <View style={s.identityPhone}>
                  <Chip
                    icon={Phone}
                    label={primaryPhone(selected)!}
                    color={theme.color.info}
                    bg={theme.color.infoBg}
                    iconColor={palette.errorRed}
                  />
                </View>
              )}
            </View>

            {/* ── Plans carousel ──────────────────────────────────── */}
            {plans.length === 0 ? (
              <Card icon={CreditCard} title="Plans" subtitle="No plans yet">
                <EmptyState
                  icon={CreditCard}
                  title="No plans"
                  message="This planholder has no plans on file."
                />
              </Card>
            ) : (
              <>
                <ScrollView
                  ref={planCarousel.ref}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  decelerationRate="fast"
                  snapToInterval={contentW + CAROUSEL_GAP}
                  snapToAlignment="start"
                  disableIntervalMomentum
                  onMomentumScrollEnd={planCarousel.onMomentumScrollEnd}
                >
                  {plans.map((plan, i) => (
                    <View
                      key={plan.lpaNumber}
                      style={{
                        marginRight: i < plans.length - 1 ? CAROUSEL_GAP : 0,
                      }}
                    >
                      <PlanCard
                        plan={plan}
                        width={contentW}
                        onViewDetails={() => setPlanSheet(plan)}
                      />
                    </View>
                  ))}
                </ScrollView>
                <Pager
                  count={plans.length}
                  index={planCarousel.index}
                  onChange={planCarousel.scrollTo}
                />
              </>
            )}

            {/* ── Pending requests ────────────────────────────────── */}
            <Card
              icon={Clock}
              title="Pending Request(s)"
              subtitle={`${pending.length} request(s) awaiting action`}
              headerAction={
                <TouchableOpacity
                  onPress={() => setHistoryOpen(true)}
                  style={s.historyBtn}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel="View request history"
                >
                  <History size={13} color={theme.color.accent} />
                  <Text style={s.historyBtnText}>History</Text>
                </TouchableOpacity>
              }
              // A single plan hides the pager, taking its bottom margin with
              // it — stand in for it so the spacing stays the same.
              style={{ marginTop: plans.length === 1 ? 14 : 0 }}
            >
              {pending.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title="No pending requests"
                  message="New requests will show up here."
                />
              ) : (
                <>
                  <ScrollView
                    ref={requestCarousel.ref}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    decelerationRate="fast"
                    snapToInterval={requestW + CAROUSEL_GAP}
                    snapToAlignment="start"
                    disableIntervalMomentum
                    onMomentumScrollEnd={requestCarousel.onMomentumScrollEnd}
                    contentContainerStyle={{ paddingVertical: 6 }}
                  >
                    {pending.map((r, i) => (
                      <View
                        key={r.transactionId}
                        style={{
                          marginRight:
                            i < pending.length - 1 ? CAROUSEL_GAP : 0,
                        }}
                      >
                        <RequestCard
                          request={r}
                          width={requestW}
                          onPress={() => setRequestSheet(r)}
                        />
                      </View>
                    ))}
                  </ScrollView>
                  <Pager
                    count={pending.length}
                    index={requestCarousel.index}
                    onChange={requestCarousel.scrollTo}
                  />
                </>
              )}
            </Card>

            {/* ── Information sections ────────────────────────────── */}
            <CollapsibleSection
              icon={User}
              title="Personal Information"
              subtitle="Name, birth date, and civil status"
              open={personalOpen}
              onToggle={() => setPersonalOpen((v) => !v)}
            >
              <RowItem label="First Name" value={selected.firstName} />
              <RowItem label="Middle Name" value={selected.middleName || "—"} />
              <RowItem label="Last Name" value={selected.lastName} />
              <RowItem label="Suffix" value={selected.suffix || "—"} />
              <RowItem label="Birth Date" value={fmtDate(selected.birthDate)} />
              <RowItem label="Gender" value={selected.gender} />
              <RowItem label="Civil Status" value={selected.civilStatus} />
              <RowItem label="Nationality" value={selected.nationality} />
              <RowItem label="Person ID" value={selected.personId} />
            </CollapsibleSection>

            <CollapsibleSection
              icon={MapPinned}
              title="Address Information"
              subtitle="Residence and office addresses"
              open={addressOpen}
              onToggle={() => setAddressOpen((v) => !v)}
            >
              <Text style={s.addressGroupLabel}>Residence</Text>
              <RowItem
                label="Street"
                value={
                  [residence?.addressNo, residence?.street]
                    .filter(Boolean)
                    .join(" ") || "—"
                }
              />
              <RowItem label="Barangay" value={residence?.barangay ?? "—"} />
              <RowItem label="District" value={residence?.district ?? "—"} />
              <RowItem label="City" value={residence?.city ?? "—"} />
              <RowItem label="Province" value={residence?.province ?? "—"} />
              <RowItem label="Zip Code" value={residence?.zipCode ?? "—"} />

              <Text style={s.addressGroupLabel}>Office</Text>
              <RowItem
                label="Street"
                value={
                  [office?.addressNo, office?.street].filter(Boolean).join(" ") ||
                  "—"
                }
              />
              <RowItem label="Barangay" value={office?.barangay ?? "—"} />
              <RowItem label="District" value={office?.district ?? "—"} />
              <RowItem label="City" value={office?.city ?? "—"} />
              <RowItem label="Province" value={office?.province ?? "—"} />
              <RowItem label="Zip Code" value={office?.zipCode ?? "—"} />
            </CollapsibleSection>

            <CollapsibleSection
              icon={Phone}
              title="Contact Information"
              subtitle="Mobile, landline, and email"
              open={contactOpen}
              onToggle={() => setContactOpen((v) => !v)}
            >
              <RowItem
                label="Mobile No."
                value={findContact(selected, "MobileNo") ?? "—"}
              />
              <RowItem
                label="Landline No."
                value={findContact(selected, "LandlineNo") ?? "—"}
              />
              <RowItem
                label="Email"
                value={findContact(selected, "Email") ?? "—"}
              />
            </CollapsibleSection>

            <CollapsibleSection
              icon={Building2}
              title="Employment Information"
              subtitle="Employer, occupation, and income"
              open={employmentOpen}
              onToggle={() => setEmploymentOpen((v) => !v)}
            >
              <RowItem label="Employer" value={selected.employment.employer} />
              <RowItem
                label="Occupation"
                value={selected.employment.occupation}
              />
              <RowItem label="Industry" value={selected.employment.industry} />
              <RowItem
                label="Monthly Income"
                value={fmtPeso(selected.employment.monthlyIncome)}
              />
              <RowItem
                label="Years Employed"
                value={`${selected.employment.yearsEmployed} year(s)`}
              />
            </CollapsibleSection>
          </>
        )}
      </Animated.ScrollView>

      {/* ── Quick actions sheet ───────────────────────────────────── */}
      <SwipeDismissModal
        visible={actionsOpen}
        onDismiss={() => setActionsOpen(false)}
        title="Quick Actions"
        sheetWidth={420}
      >
        <View style={s.sheetBody}>
          {QUICK_ACTIONS.map((action) => (
            <TouchableOpacity
              key={action.label}
              onPress={() => handleQuickAction(action)}
              activeOpacity={0.8}
              style={s.actionRow}
            >
              <IconBox
                icon={action.icon}
                color={
                  action.destructive ? theme.color.error : theme.color.accent
                }
                size={32}
              />
              <Text
                style={[
                  s.actionLabel,
                  action.destructive && { color: theme.color.error },
                ]}
              >
                {action.label}
              </Text>
              <ChevronRight size={16} color={theme.color.muted} />
            </TouchableOpacity>
          ))}
        </View>
      </SwipeDismissModal>

      {/* ── Plan details sheet ────────────────────────────────────── */}
      <SwipeDismissModal
        visible={planSheet !== null}
        onDismiss={() => setPlanSheet(null)}
        title={
          planSheet ? `${planSheet.planName} — ${planSheet.lpaNumber}` : ""
        }
        sheetWidth={460}
      >
        {planSheet && (
          <View style={s.sheetBody}>
            <View style={s.sheetMeta}>
              <RowItem label="Status" value={planSheet.status} />
              <RowItem label="LPA Number" value={planSheet.lpaNumber} />
              <RowItem label="Plan" value={planSheet.planName} />
              <RowItem label="Mode" value={planSheet.mode} />
              <RowItem label="Term" value={planSheet.term} />
              <RowItem label="Branch" value={planSheet.branch} />
              <RowItem
                label="Effective Date"
                value={fmtDate(planSheet.effectiveDate)}
              />
              <RowItem
                label="Installments"
                value={`${planSheet.installmentsPaid} of ${planSheet.installmentsTotal} paid`}
              />
              <RowItem label="Due Date" value={planSheet.dueDate} />
              <RowItem
                label="Amount Due"
                value={fmtPeso(planSheet.amountDue)}
              />
              <RowItem
                label="Contract Price"
                value={fmtPeso(planSheet.contractPrice)}
              />
              <RowItem label="Servicing Agent" value={planSheet.agent} />
            </View>
            <AppButton
              size="lg"
              style={{ marginTop: 16 }}
              onPress={() => {
                setPlanSheet(null);
                showAlert(
                  "info",
                  "Not Available",
                  "The Pay My Plan page is currently not available.",
                );
              }}
            >
              Pay This Plan
            </AppButton>
          </View>
        )}
      </SwipeDismissModal>

      {/* ── Request tracker sheet ─────────────────────────────────── */}
      <SwipeDismissModal
        visible={requestSheet !== null}
        onDismiss={() => setRequestSheet(null)}
        title={requestSheet ? requestSheet.title : ""}
        sheetWidth={420}
      >
        {requestSheet && (
          <View style={s.sheetBody}>
            <View style={s.sheetSummary}>
              <Text style={s.sheetSummaryText}>{requestSheet.description}</Text>
              <StatusPill
                label={requestSheet.status}
                color={REQUEST_STATUS_STYLES[requestSheet.status].color}
                bg={REQUEST_STATUS_STYLES[requestSheet.status].bg}
              />
            </View>
            <RequestTimeline request={requestSheet} />
            <View style={s.sheetMeta}>
              <RowItem
                label="Transaction ID"
                value={requestSheet.transactionId}
              />
              <RowItem label="Date Filed" value={requestSheet.date} />
              <RowItem
                label="Progress"
                value={`${requestSheet.currentStep} of ${requestSheet.totalSteps} steps`}
              />
            </View>
          </View>
        )}
      </SwipeDismissModal>

      {/* ── Request history sheet ─────────────────────────────────── */}
      <SwipeDismissModal
        visible={historyOpen}
        onDismiss={() => setHistoryOpen(false)}
        title="Request History"
        sheetWidth={460}
      >
        <View style={s.sheetBody}>
          {(selected?.requests ?? []).length === 0 ? (
            <EmptyState
              icon={History}
              title="No history"
              message="This planholder has no filed requests."
            />
          ) : (
            (selected?.requests ?? []).map((r) => {
              const status = REQUEST_STATUS_STYLES[r.status];
              const Icon = REQUEST_ICONS[r.type] ?? FileText;
              return (
                <View key={r.transactionId} style={s.historyRow}>
                  <IconBox icon={Icon} color={status.color} size={32} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.requestTitle} numberOfLines={1}>
                      {r.title}
                    </Text>
                    <Text style={s.requestDesc} numberOfLines={1}>
                      {r.transactionId} · {r.date}
                    </Text>
                  </View>
                  <Badge
                    label={r.status}
                    color={status.color}
                    backgroundColor={status.bg}
                  />
                </View>
              );
            })
          )}
        </View>
      </SwipeDismissModal>

      <AlertModal
        visible={alertState.visible}
        onDismiss={dismissAlert}
        variant={alertState.variant}
        title={alertState.title}
        message={alertState.message}
      />
    </>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  content: { padding: 16 },
  contentTablet: { maxWidth: 1024, alignSelf: "center", width: "100%" },

  // ── Search — mirrors LookupField's field + iconBox ──────────
  searchField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 12,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.card,
    overflow: "hidden",
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: theme.color.ink,
    paddingVertical: 11,
    paddingHorizontal: 0,
  },
  searchClear: { paddingHorizontal: 4 },
  searchIconBox: {
    backgroundColor: BRAND_COLORS.primaryGreen,
    paddingHorizontal: 14,
    minWidth: 44,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── List cards ──────────────────────────────────────────────
  list: { gap: 10, marginTop: 14 },
  listCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.card,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
  },
  listCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 8,
  },
  listCardIcon: {
    width: 30,
    height: 30,
    borderRadius: theme.radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BRAND_COLORS.mutedBg,
  },
  listCardName: { fontSize: 15, fontWeight: "700", color: theme.color.ink },
  listCardId: { fontSize: 11, color: theme.color.muted, marginTop: 1 },
  listCardChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  listCardPhone: { flexDirection: "row", marginTop: 4, marginBottom: 6 },
  listCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.color.border,
    paddingTop: 8,
    marginTop: 2,
  },
  listCardFooterHint: { fontSize: 11, color: theme.color.muted },

  // ── Shared bits ─────────────────────────────────────────────
  statusPill: { flexDirection: "row", alignItems: "center", gap: 5 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radius.full,
    maxWidth: 240,
  },
  chipText: { fontSize: 11, fontWeight: "600" },

  // ── Pager ───────────────────────────────────────────────────
  pagerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 10,
    marginBottom: 14,
  },
  pagerArrow: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  pagerDots: { flexDirection: "row", alignItems: "center", gap: 6 },
  pagerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.color.border,
  },
  pagerDotActive: { backgroundColor: theme.color.accent, width: 18 },

  // ── Identity card ───────────────────────────────────────────
  identityCard: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.card,
    padding: 14,
    marginBottom: 12,
  },
  identityTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: BRAND_COLORS.softGreen,
    backgroundColor: theme.color.successBg,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 15,
    fontWeight: "800",
    color: theme.color.accent,
    letterSpacing: 0.5,
  },
  identityName: { fontSize: 16, fontWeight: "700", color: theme.color.ink },
  identityPhone: { flexDirection: "row", marginTop: 10 },

  // ── Plan card ───────────────────────────────────────────────
  planCard: {
    borderRadius: theme.radius.lg,
    padding: 16,
    overflow: "hidden",
  },
  planCardDisc: {
    position: "absolute",
    top: -46,
    right: -30,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  planCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  planCardLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    color: "rgba(255,255,255,0.7)",
  },
  planCardLpa: {
    fontSize: 17,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.4,
    marginTop: 2,
  },
  planCardName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.3,
    marginTop: 10,
  },
  planCardMeta: { flexDirection: "row", gap: 12, marginTop: 12 },
  planCardMetaCell: { flex: 1 },
  planCardMetaValue: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
    marginTop: 3,
  },
  planCardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginTop: 14,
  },
  planCardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  planCardPaid: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "rgba(255,255,255,0.9)",
  },
  planCardDue: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "rgba(255,255,255,0.7)",
  },
  planCardDueValue: { color: "#fff", fontSize: 11 },
  planCardFooter: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    marginTop: 12,
  },
  planCardAmount: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
    marginTop: 2,
  },
  planCardBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: theme.radius.full,
    backgroundColor: "#fff",
  },
  planCardBtnText: {
    fontSize: 12,
    fontWeight: "800",
    color: BRAND_COLORS.darkGreen,
  },

  // ── Request card ────────────────────────────────────────────
  requestCard: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: BRAND_COLORS.subtleBg,
    padding: 12,
  },
  requestTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  requestTitle: { fontSize: 14, fontWeight: "700", color: theme.color.ink },
  requestDesc: { fontSize: 11, color: theme.color.muted, marginTop: 2 },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
  },
  progressTrack: { flex: 1, flexDirection: "row", alignItems: "center" },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: palette.neutralBorder,
  },
  progressLineDone: { backgroundColor: theme.color.accent },
  progressNode: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: palette.neutralBorder,
  },
  progressNodeDone: { backgroundColor: theme.color.accent },
  progressNodeActive: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 3,
    borderColor: BRAND_COLORS.softGreen,
  },
  progressText: { fontSize: 11, fontWeight: "600", color: theme.color.muted },
  requestMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  requestDate: { fontSize: 11, color: theme.color.muted },
  requestTxn: { flexDirection: "row", alignItems: "center", gap: 3 },
  requestTxnText: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.color.muted,
    letterSpacing: 0.3,
  },
  requestFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.color.border,
    paddingTop: 8,
    marginTop: 8,
  },
  requestFooterHint: { fontSize: 11, color: theme.color.muted },
  historyBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  historyBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: theme.color.accent,
  },

  // ── Collapsible sections ────────────────────────────────────
  section: {
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.color.border,
    backgroundColor: theme.color.card,
    marginBottom: 10,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  sectionIcon: {
    width: 30,
    height: 30,
    borderRadius: theme.radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BRAND_COLORS.mutedBg,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: theme.color.ink },
  sectionSubtitle: { fontSize: 11, color: theme.color.muted, marginTop: 1 },
  // Caption separating the residence and office rows within the section.
  addressGroupLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: theme.color.accent,
    marginTop: 10,
  },
  sectionBody: {
    paddingHorizontal: 14,
    paddingBottom: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.color.border,
  },

  // ── Sheets ──────────────────────────────────────────────────
  sheetBody: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 12 },
  sheetMeta: {
    backgroundColor: BRAND_COLORS.subtleBg,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.color.border,
    paddingHorizontal: 10,
  },
  sheetSummary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 14,
  },
  sheetSummaryText: { flex: 1, fontSize: 12, color: theme.color.body },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.color.border,
  },
  actionLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: theme.color.ink,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.color.border,
  },

  // ── Request timeline ────────────────────────────────────────
  timeline: { marginBottom: 16 },
  timelineRow: { flexDirection: "row", gap: 12 },
  timelineRail: { alignItems: "center", width: 16 },
  timelineNode: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    borderWidth: 2,
    borderColor: palette.neutralBorder,
    backgroundColor: theme.color.card,
  },
  timelineNodeDone: {
    borderColor: theme.color.accent,
    backgroundColor: theme.color.accent,
  },
  timelineNodeActive: {
    backgroundColor: theme.color.card,
    borderColor: theme.color.accent,
    borderWidth: 4,
  },
  timelineConnector: {
    flex: 1,
    width: 2,
    minHeight: 22,
    backgroundColor: palette.neutralBorder,
    marginVertical: 2,
  },
  timelineConnectorDone: { backgroundColor: theme.color.accent },
  timelineBody: { flex: 1, paddingBottom: 14 },
  timelineLabel: { fontSize: 13, fontWeight: "600", color: theme.color.muted },
  timelineLabelDone: { color: theme.color.ink },
  timelineHint: { fontSize: 11, color: theme.color.muted, marginTop: 1 },
});
