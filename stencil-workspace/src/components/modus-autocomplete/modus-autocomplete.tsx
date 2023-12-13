/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line
import {
  h, // eslint-disable-line @typescript-eslint/no-unused-vars
  Component,
  EventEmitter,
  Event,
  Prop,
  State,
  Listen,
  Element,
  Watch,
} from '@stencil/core';
import { IconSearch } from '../icons/icon-search';
import { IconClose } from '../icons/icon-close';

export interface ModusAutocompleteOption {
  id: string;
  value: string;
}

const DATA_ID = 'data-id';
const DATA_SEARCH_VALUE = 'data-search-value';

@Component({
  tag: 'modus-autocomplete',
  styleUrl: 'modus-autocomplete.scss',
  shadow: true,
})
export class ModusAutocomplete {
  @Element() el: HTMLElement;

  /** An array to hold the selected chips. */
  @State() selectedChips: string[] = [];

  /** Whether to show autocomplete's options when focus. */
  @Prop() showOptionsOnFocus: boolean;

  /** Add Chip while selecting. */
  @Prop() addChip: boolean;

  /** The autocomplete's aria label. */
  @Prop() ariaLabel: string | null;

  /** Whether the input has a clear button. */
  @Prop() clearable = false;

  /** Whether the input is disabled. */
  @Prop() disabled: boolean;

  /** The autocomplete's dropdown's max height. */
  @Prop() dropdownMaxHeight = '300px';

  /** The autocomplete's dropdown z-index. */
  @Prop() dropdownZIndex = '1';

  /** The autocomplete's error text. */
  @Prop() errorText: string;

  /** Whether the search icon is included. */
  @Prop() includeSearchIcon = false;

  /** The autocomplete's label. */
  @Prop() label: string;

  /** The autocomplete's no results text. */
  @Prop() noResultsFoundText = 'No results found';

  /** The autocomplete's no results sub-text. */
  @Prop() noResultsFoundSubtext = 'Check spelling or try a different keyword';

  /** The autocomplete's options. */
  @Prop({ mutable: true }) options: ModusAutocompleteOption[] | string[];
  @Watch('options')
  watchOptions() {
    this.convertOptions();
    this.updateVisibleOptions(this.value);
  }

  /** The autocomplete's input placeholder. */
  @Prop() placeholder: string;

  /** Whether to show autocomplete's options when focus. */
  @Prop() showOptionsOnFocus: boolean;

  /** Whether the autocomplete is read-only. */
  @Prop() readOnly: boolean;

  /** Whether the autocomplete is required. */
  @Prop() required: boolean;

  /** Whether to show the no results found message. */
  @Prop() showNoResultsFoundMessage = true;

  /** The autocomplete's size. */
  @Prop() size: 'medium' | 'large' = 'medium';

  /** The autocomplete's search value. */
  @Prop() value: string;

  /** An event that fires when a dropdown option is selected. Emits the option id. */
  @Event() optionSelected: EventEmitter<string>;

  /** An event that fires when the input value changes. Emits the value string. */
  @Event() valueChange: EventEmitter<string>;

  @State() containsSlottedElements = false;
  @State() hasFocus = false;
  @State() visibleOptions: ModusAutocompleteOption[] = [];
  @State() customOptions: Array<any> = [];
  @State() visibleCustomOptions: Array<any> = [];

  componentWillLoad(): void {
    this.convertOptions();

    if (!this.value) {
      this.visibleOptions = this.options as ModusAutocompleteOption[];
    } else {
      this.updateVisibleOptions(this.value);
    }
  }

  componentDidLoad(): void {
    this.updateVisibleCustomOptions(this.value);
  }

  @Listen('click', { target: 'document' })
  outsideElementClickHandler(event: MouseEvent): void {
    if (this.el !== event.target || !this.el.contains(event.target as Node)) {
      this.hasFocus = false;
    }
  }

  classBySize: Map<string, string> = new Map([
    ['medium', 'medium'],
    ['large', 'large'],
  ]);

  convertOptions(): void {
    if (this.options && this.options.length > 0) {
      if (typeof this.options[0] === 'string') {
        this.options = this.options?.map((option) => ({
          id: option,
          value: option,
        }));
      }
    }
  }

  displayNoResults = () =>
    this.showNoResultsFoundMessage &&
    this.hasFocus &&
    !this.visibleOptions?.length &&
    !this.visibleCustomOptions?.length &&
    this.value?.length > 0;

  displayOptions = () => {
    const showOptions = this.showOptionsOnFocus || this.value?.length > 0;
    return this.hasFocus && showOptions && !this.disabled;
  };

  addChipValue(value: string) {
    if (this.selectedChips.includes(value)) {
      return;
    }
    this.selectedChips = [...this.selectedChips, value];
    this.valueChange.emit(this.selectedChips.join(','));
  }
  handleCustomOptionClick = (option: any) => {
    const optionValue = option.getAttribute(DATA_SEARCH_VALUE);
    const optionId = option.getAttribute(DATA_ID);
    if (this.addChip) {
      this.addChipValue(optionValue);
    } else {
      this.handleSearchChange(optionValue);
    }
    this.hasFocus = false;
    this.optionSelected.emit(optionId);
  };

  handleInputBlur = () => {
    this.hasFocus = false;
  };

  handleOptionKeyPress = (event: any, option: any, isCustomOption = false) => {
    if (event.key !== 'Enter') {
      return;
    }
    if (isCustomOption) {
      this.handleCustomOptionClick(option);
    } else {
      this.handleOptionClick(option);
    }
  };

  handleClear(): void {
    this.selectedChips = [];
    this.value = null;
    this.valueChange.emit(null);
  }


  handleOptionClick = (option: ModusAutocompleteOption) => {
    if (this.addChip) {
      this.addChipValue(option.value);
    } else {
      this.handleSearchChange(option.value);
    }
    this.hasFocus = false;
    this.optionSelected.emit(option.id);
  };

  handleSearchChange = (search: string) => {
    this.updateVisibleOptions(search);
    this.updateVisibleCustomOptions(search);

    this.value = search;
    this.valueChange.emit(search);
  };

  handleCloseClick(chipValue: string) {
    if (this.selectedChips.length != 0) {
      this.selectedChips = this.selectedChips.filter((chip) => chip !== chipValue);
      this.valueChange.emit(this.selectedChips.join(','));
    }
  }

  handleTextInputValueChange = (event: CustomEvent<string>) => {
    // Cancel the modus-text-input's value change event or else it will bubble to consumer.
    event.stopPropagation();
    this.handleSearchChange(event.detail);
  };

  updateVisibleCustomOptions = (search: string) => {
    const slotted = this.el.shadowRoot?.querySelector('slot') as HTMLSlotElement;
    if (!slotted || typeof slotted.assignedNodes !== 'function') {
      return;
    }

    this.customOptions = slotted.assignedNodes().filter((node) => node.nodeName !== '#text');

    if (!search || search.length === 0) {
      this.visibleCustomOptions = this.customOptions;
      return;
    }

    this.visibleCustomOptions = this.customOptions?.filter((o: any) => {
      return o.getAttribute(DATA_SEARCH_VALUE).toLowerCase().includes(search.toLowerCase());
    });
    this.containsSlottedElements = this.customOptions.length > 0;
  };

  updateVisibleOptions = (search: string) => {
    if (!search || search.length === 0) {
      this.visibleOptions = this.options as ModusAutocompleteOption[];
      return;
    }

    this.visibleOptions = (this.options as ModusAutocompleteOption[])?.filter((o: ModusAutocompleteOption) => {
      return o.value.toLowerCase().includes(search.toLowerCase());
    });
  };

  // Do not display the slot for the custom options. We use this hidden slot to reference the slot's children.
  CustomOptionsSlot = () => (
    <div style={{ display: 'none' }}>
      <slot onSlotchange={() => this.updateVisibleCustomOptions(this.value)} />
    </div>
  );

  TextInput = () => (
    <modus-text-input
      class="input"
      clearable={false}
      errorText={this.hasFocus ? '' : this.errorText}
      includeSearchIcon={false}
      onValueChange={(searchEvent: CustomEvent<string>) => this.handleTextInputValueChange(searchEvent)}
      placeholder={this.placeholder}
      required={this.required}
      size={this.size}
      value={this.value}
      onBlur={this.handleInputBlur}
    />
  );

  render(): unknown {
    const classes = `autocomplete ${this.classBySize.get(this.size)}`;
    const showClearIcon = this.clearable && !this.readOnly && !!this.value;
    return (
      <div
        aria-disabled={this.disabled ? 'true' : undefined}
        aria-invalid={!!this.errorText}
        aria-label={this.ariaLabel}
        aria-readonly={this.readOnly}
        aria-required={this.required}
        class={classes}
        onFocusin={() => (this.hasFocus = true)}>
        <div class="chips-container">
          {this.selectedChips.map((chip) => (
            <modus-chip value={chip} size="medium" show-close onCloseClick={() => this.handleCloseClick(chip)}></modus-chip>
          ))}
          {this.TextInput()}
          {showClearIcon && (
            <span class="icons-clear" role="button" aria-label="Clear entry">
              <IconClose onClick={() => this.handleClear()} size="16" />
            </span>
          )}
        </div>
        <div
          class="options-container"
          style={{ maxHeight: this.dropdownMaxHeight, zIndex: this.dropdownZIndex, overflowY: 'auto' }}>
          <ul>
            {this.displayOptions() &&
              this.visibleOptions?.map((option) => {
                return (
                  <li
                    class="text-option"
                    tabindex="0"
                    onClick={() => this.handleOptionClick(option)}
                    onKeyPress={(ev) => this.handleOptionKeyPress(ev, option)}
                    onBlur={this.handleInputBlur}>
                    {option.value}
                  </li>
                );
              })}
            {this.displayOptions() &&
              this.visibleCustomOptions?.map((option) => (
                <li
                  class="custom-option"
                  tabindex="0"
                  tabindex="0"
                  onClick={() => this.handleCustomOptionClick(option)}
                  onKeyPress={(ev) => this.handleOptionKeyPress(ev, option, true)}
                  innerHTML={option.outerHTML}
                  onBlur={this.handleInputBlur}
                />
              ))}
          </ul>
          {this.displayNoResults() && <NoResultsFound text={this.noResultsFoundText} subtext={this.noResultsFoundSubtext} />}
        </div>
        {this.CustomOptionsSlot()}
      </div>
    );
  }
}

const NoResultsFound = (props: { text: string; subtext: string }) => (
  <div class="no-results">
    <div style={{ display: 'flex' }}>
      <IconSearch size="28px" />
      <div class="message">{props.text}</div>
    </div>
    <div class="subtext">{props.subtext}</div>
  </div>
);
