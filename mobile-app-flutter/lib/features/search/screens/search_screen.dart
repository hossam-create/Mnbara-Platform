import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_staggered_grid_view/flutter_staggered_grid_view.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/l10n/app_localizations.dart';
import '../../../shared/widgets/product_card.dart';
import '../providers/search_provider.dart';

class SearchScreen extends ConsumerStatefulWidget {
  final String initialQuery;

  const SearchScreen({super.key, this.initialQuery = ''});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  late TextEditingController _searchController;
  final _focusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController(text: widget.initialQuery);
    if (widget.initialQuery.isNotEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        ref.read(searchProvider.notifier).search(widget.initialQuery);
      });
    }
    _focusNode.requestFocus();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final searchState = ref.watch(searchProvider);

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: TextField(
          controller: _searchController,
          focusNode: _focusNode,
          decoration: InputDecoration(
            hintText: l10n.translate('search_hint'),
            border: InputBorder.none,
            suffixIcon: _searchController.text.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.clear),
                    onPressed: () {
                      _searchController.clear();
                      ref.read(searchProvider.notifier).clear();
                    },
                  )
                : null,
          ),
          onSubmitted: (query) {
            if (query.isNotEmpty) ref.read(searchProvider.notifier).search(query);
          },
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () {
              if (_searchController.text.isNotEmpty) {
                ref.read(searchProvider.notifier).search(_searchController.text);
              }
            },
          ),
        ],
      ),
      body: _buildBody(searchState, l10n),
    );
  }

  Widget _buildBody(SearchState state, AppLocalizations l10n) {
    if (state.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.query.isEmpty) {
      return _buildRecentSearches(l10n);
    }

    if (state.results.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.search_off, size: 100, color: AppColors.textSecondary.withOpacity(0.5)),
            const SizedBox(height: 24),
            Text(l10n.translate('no_results'), style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            Text('${l10n.translate('no_results_for')} "${state.query}"', style: TextStyle(color: AppColors.textSecondary)),
          ],
        ),
      );
    }

    return MasonryGridView.count(
      padding: const EdgeInsets.all(16),
      crossAxisCount: 2,
      mainAxisSpacing: 16,
      crossAxisSpacing: 16,
      itemCount: state.results.length,
      itemBuilder: (context, index) => ProductCard(product: state.results[index]),
    );
  }

  Widget _buildRecentSearches(AppLocalizations l10n) {
    final recentSearches = ref.watch(recentSearchesProvider);

    if (recentSearches.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.search, size: 100, color: AppColors.textSecondary.withOpacity(0.5)),
            const SizedBox(height: 24),
            Text(l10n.translate('search_products'), style: Theme.of(context).textTheme.titleLarge),
          ],
        ),
      );
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(l10n.translate('recent_searches'), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            TextButton(
              onPressed: () => ref.read(recentSearchesProvider.notifier).clear(),
              child: Text(l10n.translate('clear_all')),
            ),
          ],
        ),
        ...recentSearches.map((query) => ListTile(
          leading: const Icon(Icons.history, color: AppColors.textSecondary),
          title: Text(query),
          trailing: IconButton(
            icon: const Icon(Icons.close, size: 18),
            onPressed: () => ref.read(recentSearchesProvider.notifier).remove(query),
          ),
          onTap: () {
            _searchController.text = query;
            ref.read(searchProvider.notifier).search(query);
          },
        )),
      ],
    );
  }
}
