import {
    Animated,
    FlatList,
    Image,
    ImageSourcePropType,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Svg, { Path } from "react-native-svg";
import { computeTop, validateBracket } from "./bracketUtils";

/**
 * Represents a single match in the bracket.
 *
 * Supported bracket sizes (matches per first round): 4, 8, 16, 32
 * — i.e. powers of 2. Each subsequent round must have exactly half
 * the matches of the previous one.
 */
export interface BracketMatch {
    id: number | string;
    level: string;
    levelName?: string;
    home_team: { id: number | string; name: string };
    away_team: { id: number | string; name: string };
}

/** The item passed to renderNavButton — represents one round in the nav bar. */
export interface NavButtonItem {
    id: number;
    name: string;
}

export interface BracketViewProps {
    /** Flat array of all matches across all rounds, ordered by round level. */
    data: BracketMatch[];
    /** Custom card renderer. When provided, replaces the default match card. */
    renderMatch?: (match: BracketMatch) => React.ReactNode;
    /** Called when a match card is pressed. */
    onMatchPress?: (match: BracketMatch) => void;
    /**
     * Custom nav button renderer. Receives the round item, its index,
     * whether it is currently active, and the onPress handler to scroll
     * to that round. When provided, replaces the default nav button.
     */
    renderNavButton?: (props: {
        item: NavButtonItem;
        index: number;
        isActive: boolean;
        onPress: () => void;
    }) => React.ReactNode;
    /** Show or hide the top navigation bar. Default: true */
    showNavigation?: boolean;
    /** Padding of the navigation bar. Default: { horizontal: 20, vertical: 30 } */
    navPadding?: { horizontal?: number; vertical?: number };
    /** Color of the SVG connector lines. Default: "#2b6cb0" */
    lineColor?: string;
    /** Height of each match card. Default: 100 */
    itemHeight?: number;
    /** Vertical gap between match cards. Default: 12 */
    gap?: number;
    /** Width of each column (also controls scroll snap). Default: 200 */
    columnWidth?: number;
    /** Background color of the component. Default: "#0D1E62" */
    backgroundColor?: string;
    /** Background color of the default match card. Default: "#213693" */
    matchBackgroundColor?: string;
    /** Nav button color when active. Default: "#F5BD47" */
    navActiveColor?: string;
    /** Nav button color when inactive. Default: "#213693" */
    navInactiveColor?: string;
    /** Image source for the trophy shown after the final round. Hidden if not provided. */
    trophySource?: ImageSourcePropType;
    /** Size of the trophy image. Default: { width: 70, height: 100 } */
    trophySize?: { width: number; height: number };
}

const H_PADDING = 32;

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const BracketWithLines = ({
    data,
    renderMatch,
    onMatchPress,
    renderNavButton,
    showNavigation = true,
    navPadding,
    lineColor = "#2b6cb0",
    itemHeight = 100,
    gap = 12,
    columnWidth = 200,
    backgroundColor = "#0D1E62",
    matchBackgroundColor = "#213693",
    navActiveColor = "#F5BD47",
    navInactiveColor = "#213693",
    trophySource,
    trophySize = { width: 70, height: 100 },
}: BracketViewProps) => {
    const BASE_SPACING = itemHeight + gap;

    const scrollX = useRef(new Animated.Value(0)).current;
    const [leagueData, setLeagueData] = useState<BracketMatch[][]>([]);
    const [offset, setOffset] = useState(0);
    const [buttonArray, setButtonArray] = useState<NavButtonItem[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);

    // Refs so the scroll listener always reads fresh state without stale closures
    const buttonArrayRef = useRef<NavButtonItem[]>([]);
    const scrollViewRef_buttons = useRef<FlatList<NavButtonItem>>(null);
    const scrollViewRef = useRef<ScrollView>(null);
    const lastNavIndexRef = useRef(0);

    // Stable signature so an inline `data={[...]}` prop doesn't re-run the effect every render
    const dataSignature = useMemo(
        () => JSON.stringify(data.map((m) => ({ id: m.id, level: m.level }))),
        [data]
    );

    useEffect(() => {
        const roundLevels = Array.from(
            new Map(
                data
                    .filter((match) => match.level)
                    .map((match) => [
                        match.level,
                        { key: match.level, name: match.levelName ?? match.level },
                    ])
            ).values()
        );

        const grouped = roundLevels
            .map((level) => data.filter((a) => a.level === level.key))
            .filter((round) => round.length > 0);

        const warning = validateBracket(grouped);
        if (warning) console.warn(`[BracketView] ${warning}`);

        const buttons: NavButtonItem[] = roundLevels.map((level, index) => ({
            id: index,
            name: level.name,
        }));

        buttonArrayRef.current = buttons;
        setLeagueData(grouped);
        setButtonArray(buttons);
        setActiveIndex(0);
        setOffset(0);
        lastNavIndexRef.current = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dataSignature]);

    const getLeft = useCallback(
        (colIndex: number) => H_PADDING + colIndex * (columnWidth + 20),
        [columnWidth]
    );

    const getTop = useCallback(
        (colIndex: number, itemIndex: number) =>
            computeTop(colIndex, itemIndex, leagueData, offset, BASE_SPACING, itemHeight),
        [leagueData, offset, BASE_SPACING, itemHeight]
    );

    // Per-column animated translations — only the column being scrolled into view animates
    const columnTranslations = useMemo(() => {
        const translateAmount = (itemHeight * (1 - 0.85)) / 2;
        return leagueData.map((_, colIndex) =>
            scrollX.interpolate({
                inputRange: [
                    (colIndex - 1) * columnWidth,
                    colIndex * columnWidth,
                    (colIndex + 1) * columnWidth,
                ],
                outputRange: [translateAmount, 0, translateAmount],
                extrapolate: "clamp",
            })
        );
    }, [leagueData, columnWidth, itemHeight, scrollX]);

    // Memoized so the listener closure captures refs (never stale) instead of state
    const onScroll = useMemo(
        () =>
            Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                {
                    useNativeDriver: true,
                    listener: (event: { nativeEvent: { contentOffset: { x: number } } }) => {
                        const offsetX = event.nativeEvent.contentOffset.x;
                        setOffset(offsetX / (columnWidth - 100));
                        const currentIndex = Math.round(offsetX / columnWidth);
                        setActiveIndex(currentIndex);

                        if (
                            currentIndex !== lastNavIndexRef.current &&
                            scrollViewRef_buttons.current &&
                            buttonArrayRef.current.length > currentIndex &&
                            currentIndex >= 0
                        ) {
                            lastNavIndexRef.current = currentIndex;
                            scrollViewRef_buttons.current.scrollToIndex({
                                index: currentIndex,
                                animated: true,
                                viewPosition: 0.5,
                            });
                        }
                    },
                }
            ),
        [columnWidth, scrollX]
    );

    const onPressNavigation = useCallback(
        (position: number) => {
            scrollViewRef.current?.scrollTo({ x: position * columnWidth, animated: true });
        },
        [columnWidth]
    );

    const svgPaths = useMemo((): string[] => {
        if (!leagueData.length) return [];
        const paths: string[] = [];
        const cardWidth = columnWidth - 18;

        for (let col = 0; col < leagueData.length - 1; col++) {
            const column = leagueData[col] ?? [];
            const nextColumn = leagueData[col + 1] ?? [];
            const left = getLeft(col);
            const nextLeft = getLeft(col + 1);

            for (let i = 0; i < column.length; i++) {
                const parentIndex = Math.floor(i / 2);
                if (parentIndex >= nextColumn.length) continue;

                const childCenterY = getTop(col, i) + itemHeight / 2;
                const childRightX = left + cardWidth - 6;
                const parentCenterY = getTop(col + 1, parentIndex) + itemHeight / 2;
                const parentLeftX = nextLeft + 6;
                const midX = (childRightX + parentLeftX) / 2;

                paths.push(
                    `M ${childRightX} ${childCenterY} L ${midX} ${childCenterY} L ${midX} ${parentCenterY} L ${parentLeftX} ${parentCenterY}`
                );
            }
        }

        return paths;
    }, [leagueData, getTop, getLeft, columnWidth, itemHeight]);

    if (!leagueData.length) {
        return (
            <View style={[styles.container, { backgroundColor }]}>
                <Text style={styles.noDataText}>No data</Text>
            </View>
        );
    }

    const firstColumnCount = leagueData[0]?.length || 0;
    const contentHeight = firstColumnCount * BASE_SPACING;
    const contentWidth = leagueData.length * (columnWidth + 20) + H_PADDING * 2;

    const defaultMatchCard = (match: BracketMatch) => (
        <>
            <Text style={styles.txtTitle}>{match.level.toLowerCase()}</Text>
            <Text style={styles.txtTeamName}>{match.away_team.name}</Text>
            <Text style={styles.txtTeamName}>{match.home_team.name}</Text>
        </>
    );

    return (
        <View style={[styles.container, { backgroundColor }]}>
            {showNavigation && (
                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={buttonArray}
                    keyExtractor={(item) => String(item.id)}
                    style={[
                        styles.navList,
                        {
                            paddingHorizontal: navPadding?.horizontal ?? 20,
                            paddingVertical: navPadding?.vertical ?? 30,
                        },
                    ]}
                    renderItem={({ item, index }) => {
                        const onPress = () => onPressNavigation(index);
                        if (renderNavButton) {
                            return (
                                <>{renderNavButton({ item, index, isActive: activeIndex === index, onPress })}</>
                            );
                        }
                        return (
                            <TouchableOpacity
                                onPress={onPress}
                                accessibilityRole="button"
                                accessibilityLabel={`Navigate to ${item.name}`}
                                accessibilityState={{ selected: activeIndex === index }}
                                style={[
                                    styles.navButton,
                                    {
                                        backgroundColor:
                                            activeIndex === index ? navActiveColor : navInactiveColor,
                                    },
                                ]}
                            >
                                <Text style={styles.txtTeamName}>{item.name}</Text>
                            </TouchableOpacity>
                        );
                    }}
                    onScrollToIndexFailed={() => {}}
                    ref={scrollViewRef_buttons}
                />
            )}

            <ScrollView style={styles.scrollContainer}>
                <Animated.ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ height: contentHeight }}
                    scrollEventThrottle={16}
                    onScroll={onScroll}
                    ref={scrollViewRef}
                >
                    <View style={{ width: contentWidth, height: contentHeight }}>
                        <Svg
                            style={styles.svgOverlay}
                            width={contentWidth}
                            height={contentHeight}
                            pointerEvents="none"
                        >
                            {svgPaths.map((d, idx) => (
                                <Path
                                    key={`path-${idx}`}
                                    d={d}
                                    stroke={lineColor}
                                    strokeWidth={2}
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    opacity={0.9}
                                />
                            ))}
                        </Svg>

                        {leagueData.map((column, colIndex) => (
                            <View
                                key={`col-${colIndex}`}
                                style={{ position: "absolute", left: getLeft(colIndex), width: columnWidth }}
                            >
                                {column.map((match, idx) => (
                                    <AnimatedTouchableOpacity
                                        key={`col-${colIndex}-item-${idx}`}
                                        onPress={() => onMatchPress?.(match)}
                                        accessibilityRole="button"
                                        accessibilityLabel={`${match.away_team.name} vs ${match.home_team.name}`}
                                        style={[
                                            styles.matchBox,
                                            {
                                                position: "absolute",
                                                top: getTop(colIndex, idx),
                                                width: columnWidth - 18,
                                                height: itemHeight,
                                                backgroundColor: matchBackgroundColor,
                                                transform: [{ translateY: columnTranslations[colIndex] }],
                                            },
                                        ]}
                                    >
                                        {renderMatch ? renderMatch(match) : defaultMatchCard(match)}
                                    </AnimatedTouchableOpacity>
                                ))}
                            </View>
                        ))}

                        {trophySource && (
                            <View
                                style={[
                                    styles.trophyContainer,
                                    { top: getTop(leagueData.length - 1, 0) },
                                ]}
                            >
                                <Image
                                    source={trophySource}
                                    style={{ width: trophySize.width, height: trophySize.height }}
                                    accessibilityLabel="Tournament trophy"
                                />
                            </View>
                        )}
                    </View>
                </Animated.ScrollView>
            </ScrollView>
        </View>
    );
};

export default BracketWithLines;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContainer: {
        flex: 1,
    },
    navList: {
        flexGrow: 0,
    },
    navButton: {
        marginRight: 10,
        width: 120,
        height: 40,
        borderRadius: 6,
        paddingVertical: 6,
        alignItems: "center",
        justifyContent: "center",
    },
    svgOverlay: {
        position: "absolute",
        left: 0,
        top: 0,
    },
    matchBox: {
        borderRadius: 6,
        justifyContent: "flex-start",
        paddingTop: 2,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 1,
    },
    trophyContainer: {
        position: "absolute",
        right: -20,
    },
    noDataText: {
        color: "#ffffff",
        textAlign: "center",
        fontSize: 16,
        fontWeight: "bold",
    },
    txtTitle: {
        color: "#F5BD47",
        textAlign: "left",
        fontSize: 12,
        paddingHorizontal: 10,
        paddingTop: 4,
    },
    txtTeamName: {
        color: "#FFFFFF",
        textAlign: "left",
        fontSize: 12,
        paddingHorizontal: 10,
        paddingTop: 4,
    },
});
