export async function handle(state, action) {
  const input = action.input;
  const caller = action.caller;

  const articles = state.articles;
  const maintainers = state.maintainers;

  const ERROR_INVALID_ARWEAVE_ADDRESS = "invalid_arweave_address";
  const ERROR_CALLER_NOT_MAINTAINER = "caller_is_not_whitelisted_as_maintainer";
  const ERROR_ADDRESS_IS_MAINTAINER = "the_given_address_has_been_already_whitelisted";
  const ERROR_URL_NOT_VALID = "invalid_url_has_been_seeded";
  const ERROR_NAME_NOT_VALID = "the_name_must_have_2_to_75_characters";
  const ERROR_TAG_NOT_VALID = "the_tag_has_invalid_entries";
  const ERROR_ID_NOT_VALID = "the_given_article_id_is_not_valid_or_registered";
  const ERROR_SLUG_NOT_VALID = "slug_must_be_2_to_300_chars_string";

  if (input.function === "addMaintainer") {
    const address = input.address;

    _validateAddress(address);
    _isMainatiner(caller);

    if (!maintainers.includes(address)) {
      maintainers.push(address);

      return { state };
    }

    throw new ContractError(ERROR_ADDRESS_IS_MAINTAINER);
  }

  if (input.function === "addArticle") {
    const id = input.id;
    const slug = input.slug;

    const tags = await SmartWeave.transaction.tags;

    _isMainatiner(caller);

    _checkTagKeyValue(tags, "Protocol-Name", "WP-Bridge");
    _checkTagKeyValue(tags, "Protocol-Action", "Add-Archive");
    _checkTagKeyValue(tags, "Content-Type", "application/json");

    if (!id || !Number.isInteger(id) || articles.find((a) => a.wpaid === id)) {
      throw new ContractError(ERROR_ID_NOT_VALID);
    }

    if (!typeof slug === "string" || !_range(2, 300).includes(slug.length)) {
      throw new ContractError(ERROR_SLUG_NOT_VALID);
    }

    articles.push({
      slug: slug,
      aid: SmartWeave.transaction.id, // article TXID
      wpaid: id, // wordpress article ID
    });

    return { state };
  }

  if (input.function === "update_url") {
    const url = input.url;

    _isMainatiner(caller);

    if (!_testUrl(url)) {
      throw new ContractError(ERROR_URL_NOT_VALID);
    }

    state.web2_url = url;

    return { state };
  }

  if (input.function === "update_name") {
    const name = input.name;

    _isMainatiner(caller);

    if (typeof name !== "string" || !_range(2, 75).includes(name.length)) {
      throw new ContractError(ERROR_NAME_NOT_VALID);
    }

    state.name = name;

    return { state };
  }

  function _validateAddress(address) {
    if (typeof address !== "string" || !/[a-z0-9_-]{43}/i.test(address)) {
      throw new ContractError(ERROR_INVALID_ARWEAVE_ADDRESS);
    }
  }

  function _isMainatiner(address) {
    _validateAddress(address);

    if (!maintainers.includes(address)) {
      throw new ContractError(ERROR_CALLER_NOT_MAINTAINER);
    }
  }

  function _testUrl(url) {
    return /[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/.test(
      url
    );
  }

  function _checkTagKeyValue(tags, key, value) {
    const tagExistence = tags.find(
      (tag) => tag["name"] === key && tag["value"] === value
    );

    if (!tagExistence) {
      throw new ContractError(ERROR_TAG_NOT_VALID);
    }
  }

  function _range(start, end) {
    return Array(end - start + 1).fill().map((_, idx) => start + idx)
  }
}

