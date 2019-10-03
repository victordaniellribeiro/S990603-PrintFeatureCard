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
            '<span class="preliminaryestimate">{[this.getPreliminaryEstimate(values)]}</span>' +
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
                getPreliminaryEstimate: function(values) {                    
                    return values.PreliminaryEstimate && values.PreliminaryEstimate.Name || 'None';
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
                fetch: ['FormattedID', 'Name', 'Owner', 'Description', 'LeafStoryPlanEstimateTotal', 'PreliminaryEstimate'],
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

        // getOptions: function() {
        //     return [
        //         this.getPrintMenuOption({title: 'Print Feature Cards App'}) //from printable mixin
        //     ];
        // }
        getOptions: function() {
                return [
                        {
                            text: 'Print',
                            handler: this._onButtonPressed,
                            scope: this
                        }
                    ];
                },

                _onButtonPressed: function() {
                    options = "toolbar=1,menubar=1,scrollbars=yes,scrolling=yes,resizable=yes,width=1000,height=500";

                    var css = '<style type="text/css"> '+ 
        '.printcards{margin:5px;width:100%;height:100%}.printcards html{background-color:#fff;color:#000;font:14pt / 1.26;margin:0;padding:0}.printcards .header{margin:5px}.printcards .description{float:left;font:12pt NotoSans, Helvetica, Arial;margin:0.25em auto 0 auto;padding-left:1.0em;padding-right:1.0em;overflow-y:hidden;width:100%;word-wrap:break-word}.printcards .card-header{border:1px;border-bottom-style:solid;display:table-cell;height:40px;vertical-align:middle;width:4.3in}.printcards .name{font:28px ProximaNovaBold, Helvetica, Arial;padding-top:0.5em;text-align:center}.printcards .owner{float:right;height:40px}.printcards .ownerText{float:right;font:14pt / 1.26 NotoSans,Helvetica,Arial;margin-right:0.3em;margin-top:0.3em}.printcards .formattedid{float:left;font:14pt / 1.26 NotoSans,Helvetica,Arial;margin-left:0.25em;margin-top:0.3em}.printcards .planestimate{bottom:0.5em;position:absolute;right:0.5em}.printcards .preliminaryestimate{margin:0.25em auto 0 auto;padding-left:1.0em;bottom:0.5em;position:absolute}.printcards .content{height:2.4in;overflow:hidden;width:4.3in;color:black;padding-left:4px;padding-right:8px}.printcards body{background-color:#fff;margin:0;padding:0}.printcards .cb{clear:both}.printcards .artifact{background-color:#fff;border:2px solid #000;float:left;height:3.2in;margin:0.1in 0.1in 0.1in 0.1in;position:relative;overflow:hidden;width:4.3in}.print-page .printcards{width:920px !important;height:100% !important;overflow:hidden !important}.print-page .printcards .header{display:none}@media print{.printcards .pb{page-break-after:always;clear:both}} ' +
    '</style>';//document.getElementsByTagName('style')[0].innerHTML;
                    var title = "Print Features";
                    var printWindow = window.open('', '', options);

                    var doc = printWindow.document;

                    var grid = this.down('#cards');

                    doc.write('<html><head>' + css + '<title>' + title + '</title>');
                    doc.write('</head><body class="printcards">');
                    doc.write(grid.getEl().dom.innerHTML);
                    doc.write('</body></html>');
                    doc.close();

                    this._injectCSS(printWindow);

                    printWindow.print();

                },
                _injectCSS: function(printWindow){
                    //find all the stylesheets on the current page and inject them into the new page
                    Ext.each(Ext.query('link'), function(stylesheet){
                        this._injectContent('', 'link', {
                            rel: 'stylesheet',
                            href: stylesheet.href,
                            type: 'text/css'
                        }, printWindow.document.getElementsByTagName('head')[0], printWindow);
                    }, this);
                },
                _injectContent: function(html, elementType, attributes, container, printWindow){
                    elementType = elementType || 'div';
                    container = container || printWindow.document.getElementsByTagName('body')[0];

                    var element = printWindow.document.createElement(elementType);

                    Ext.Object.each(attributes, function(key, value){
                        if (key === 'class') {
                            element.className = value;
                        } else {
                            element.setAttribute(key, value);
                        }
                    });

                    if(html){
                        element.innerHTML = html;
                    }

                    return container.appendChild(element);
                }
    });
})();