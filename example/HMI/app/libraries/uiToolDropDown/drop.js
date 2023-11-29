/*
 * File: drop.js
 * Copyright (c) 2023 Loupe
 * https://loupe.team
 * 
 * This file is part of StarterHmiProject, licensed under the MIT License.
 */

// If the user clicks on a dropdow menu item find
//  the nearest selected item in the dropdown and set the text
// Expected structure:
{
    /* 
    <el class ='dropup || dropdown'>
        <el class='selected-item'>text</el>
        <el class='dropdown-menu'>
            <el class='dropdown-item'>
                Text 1
            </el>
            <el class='dropdown-item'>
                Text 2
            </el>
            <el class='dropdown-item'>
                Text 3
            </el>
        </el>
    </el> 
    */
}
$(document).on({
    'click': function (e) {
        let item = $(this).closest('.dropdown-menu').siblings('.selected-item')
        let text = item.find('.selected-item-text')
        if( text.length ){
            text.text($(this).text());
            text.val($(this).text());    
        }
        else{
            item.text($(this).text());
            item.val($(this).text());    
        }
        e.stopPropagation()
        e.preventDefault();
    }
}, '.dropdown-menu .dropdown-item')

// Handle dropdown subs so that the dropdown doesn't close
// Expected structure:
{
    /* 
    <el class="dropup || dropdown">
        <el data-toggle="dropdownsub"></el>
        <el class="dropdown-menu">
            <el class="dropdown-item"></el>
            <el class="dropdown-item dropup || dropdown">
                <el data-toggle="dropdownsub"></el>
                <el class="dropdown-menu">
                    <el class="dropdown-item"></el>
                    <el class="dropdown-item"></el>
                </el>
            </el>
        </el>
    </el> 
    */
}
$(document).on({
    'click': function (e) {
        var container = $(this);
        if (container.is(e.target) || container.has(e.target).length) {
            p = $(e.target).closest(".dropup, .dropdown")
            p.toggleClass('open');
            e.stopPropagation();
            e.preventDefault();
        } 
    }
}, "[data-toggle='dropdownsub']");

// Close dropdowns if we click off them or their subs
// Expected structure:
{0
    /* 
    <el class="dropup || dropdown">
        <el data-toggle="dropdownsub"></el>
        <el class="dropdown-menu">
            <el class="dropdown-item"></el>
            <el class="dropdown-item dropup || dropdown">
                <el data-toggle="dropdownsub"></el>
                <el class="dropdown-menu">
                    <el class="dropdown-item"></el>
                    <el class="dropdown-item"></el>
                </el>
            </el>
        </el>
    </el> 
    */
}
$(document).on({
    'mousedown': function (e) {
        // Find all dropdowns
        var container = $(".dropup, .dropdown");
        // If the target of the click isn't in this dropdown, close this dropdown
        container.each(element => {
            $el = $(container[element])
            if (!$el.is(e.target) && $el.has(e.target).length === 0) {
                $el.removeClass('open');
            }
        });
    }
});