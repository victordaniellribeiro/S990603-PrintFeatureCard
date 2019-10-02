(function() {
    var Ext = window.Ext4 || window.Ext;

    Ext.define('Rally.apps.printcards.PrintCard', {
        extend: 'Ext.Component',
        alias: 'widget.printcard',
        tpl: Ext.create('Ext.XTemplate', '<tpl><div class="artifact">' +
            '<div class="card-header">' +
            '<span class="formattedid">{FormattedID}{[this.getParentID(values)]}</span>' +
            '<span class="owner">{[this.getOwnerImage(values)]}</span>' +
            '<span class="ownerText">{[this.getOwnerName(values)]}</span>' +
            '</div>' +
            '<div class="content">' +
            '<div class="name">{Name}</div>' +
            '<div class="description">{Description}</div>' +
            '</div>' +
            '<span class="planestimate">{[this.getEstimate(values)]}</span>' +
            '</div></tpl>', {
                getOwnerImage: function(values) {
                    return values.Owner && ('<img src="' + Rally.util.User.getProfileImageUrl(40,values.Owner._ref) + '"/>') || '';
                },
                getOwnerName: function(values) {
                    return values.Owner && values.Owner._refObjectName || 'No Owner';
                },
                getParentID: function(values) {
                    return values.WorkProduct && (':' + values.WorkProduct.FormattedID) || '';
                },
                // Tasks have Estimate(s), Stories have PlanEstimate(s)
                getEstimate: function(values) {
                    return values.Estimate || values.LeafStoryPlanEstimateTotal || 'None';
                }
            }
        )
    });

    Ext.define('Rally.apps.printcards.printstorycards.PrintStoryCardsApp', {
        extend: 'Rally.app.TimeboxScopedApp',
        alias: 'widget.printstorycards',
        requires: [
            'Rally.data.wsapi.Store',
            'Rally.apps.printcards.PrintCard',
            'Rally.app.plugin.Print'
        ],
        plugins: [{
            ptype: 'rallyappprinting'
        }],
        helpId: 241,
        componentCls: 'printcards',
        scopeType: 'release',
        autoScroll: false,

        launch: function() {
            this.add({
                xtype: 'container',
                itemId: 'cards',
                autoScroll: true,
                height: '100%'
            });
            this.callParent(arguments);
        },

        onScopeChange: function(scope) {
            this.down('#cards').getEl().setHTML('');
            this._loadStories(scope);
        },

        _loadStories: function(scope) {
            Ext.create('Rally.data.wsapi.Store', {
                context: this.getContext().getDataContext(),
                autoLoad: true,
                model: Ext.identityFn('PortfolioItem/Feature'),
                fetch: ['FormattedID', 'Name', 'Owner', 'Description', 'LeafStoryPlanEstimateTotal'],
                limit: (scope.getRecord()) ? 200 : 50,
                listeners: {
                    load: this._onStoriesLoaded,
                    scope: this
                },
                filters: [
                    scope.getQueryFilter()
                ]
            });
        },

        _onStoriesLoaded: function(store, records) {
            var printCardHtml = '';
            _.each(records, function(record, idx) {
                printCardHtml += Ext.create('Rally.apps.printcards.PrintCard').tpl.apply(record.data);
                if (idx%4 === 3) {
                    printCardHtml += '<div class="pb"></div>';
                }
            }, this);
            Ext.DomHelper.insertHtml('beforeEnd', this.down('#cards').getEl().dom, printCardHtml);

            if(Rally.BrowserTest) {
                Rally.BrowserTest.publishComponentReady(this);
            }
        },

        getOptions: function() {
            return [
                this.getPrintMenuOption({title: 'Print Feature Cards App'}) //from printable mixin
            ];
        }
    });
})();