import styled, { css } from "styled-components";
import { StyledNavigationButton } from "../../NavigationButton/style";

export const StyledSearchIcon = styled(StyledNavigationButton)`
    height: 28px;
    margin: 0 2px;
    position: absolute;
    transition: 0.3s color, 0.2s width;
    flex-direction: row;
    font-size: 12px;
    place-items: center;

    svg {
        min-width: 14px;
    }

    svg.feather.feather-lock {
        opacity: 0.7
    }

    svg.feather.feather-lock g rect {
        fill: black;
    }
    
    ${({ isNTP, showSearchText, isFocused, searchWidth }: { isNTP: boolean; showSearchText: boolean; isFocused: boolean; searchWidth: number; }) => css`
        &:hover, &:active { background-color: ${isNTP || isFocused ? "transparent" : ""}; }

        &:hover {
            &:after {
                opacity: ${isFocused ? 1 : 0};
            }
        }

        width: ${showSearchText ? searchWidth : '34'}px;

        svg {
            padding-right: ${showSearchText ? '8px' : '0px'};
        }

        &:after {
            content: ${showSearchText ? "''" : ""};
            position: absolute;
            right: 0;
            height: 18px;
            width: 1px;
            background-color: #d7d7d7;
            transition: 0.2s opacity;
        }
    `};
`;

export const SearchIconText = styled.span`
    overflow: hidden;
    white-space: nowrap;
    transition: 0.2s width, 0.1s padding-left 0.3s, 0.2s opacity;

    ${({ visible, textWidth }: { visible: boolean; textWidth: number }) => css`
        width: ${visible ? textWidth : 0}px;
        opacity: ${visible ? 1 : 0};
    `};
`;