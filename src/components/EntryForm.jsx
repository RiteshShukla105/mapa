import React, { Component } from "react";
import { connect }          from 'react-redux'
import { translate        } from "react-i18next";
import T                    from "prop-types";
import styled, { ThemeProvider }               from "styled-components";
import DayPickerInput from 'react-day-picker/DayPickerInput';
import { FontAwesomeIcon }  from '@fortawesome/react-fontawesome'
import { reduxForm,
         Field,
         initialize, formValueSelector,  }       from "redux-form";
import jCaptcha from 'js-captcha'
import 'react-day-picker/lib/style.css';

import Actions              from "../Actions";
import validation           from "../util/validation";
import NavButton            from "./pure/NavButton";
import { IDS, NAMES }       from "../constants/Categories";
import URLs                 from "../constants/URLs";
import LICENSES             from "../constants/Licenses";
import { EDIT             } from "../constants/Form";
import SelectTags           from './SelectTags';
import ScrollableDiv        from "./pure/ScrollableDiv";
import NavButtonWrapper     from "./pure/NavButtonWrapper";

const renderDatePickerStart = ({ input, initEndDate, endDate, ...props }) => (
  <DayPickerInput
    {...props}
    value={ input.value ? convertToDateForPicker(input.value) : '' }
    inputProps={{ ...input, readOnly: true }}
    onDayChange={(day) => input.onChange(day)}
    dayPickerProps={{
      disabledDays : {
        before: new window.Date(), after: endDate ? endDate : (initEndDate ? initEndDate : '')
      },
      showOverlay: false }}
  />
);

const renderDatePickerEnd = ({ input, initStartDate, startDate,  ...props }) => {
  return (
    <DayPickerInput
      {...props}
      value={input.value ? convertToDateForPicker(input.value) : ''}
      inputProps={{ ...input, readOnly: true }}
      onDayChange={(day) => input.onChange(day)}
      dayPickerProps={{
        disabledDays: {
          before: startDate ? startDate : (initStartDate ? initStartDate : new window.Date())
        },
        showOverlay: false }}
    />
  );
};

function convertToDateForPicker(date) {
  const d = new window.Date(date);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

class Form extends Component {
  state = {
    isEventEntry: false,
    startDate: '',
    endDate: '',
    maxCountOfCharacters: 250,
    countOfCharacters: 0,
    captcha: null,
    captchaStatus: false
  };

  initializationOfCaptcha = (t) => {
    const captchaSubmitButton = document.querySelector('#captcha-submit-button');
    let captcha = new jCaptcha({
      el: ".jCaptcha",
      canvasClass: "jCaptchaCanvas",
      canvasStyle: {
        width: "100px",
        height: "15px",
        textBaseline: "top",
        font: "15px Arial",
        textAlign: "left",
        fillStyle: "#000"
      },
      status: 'error',
      requiredValue: '=',
      callback: function(response, $el, numberOfTries) {
        captcha.options.status = response;
        if (response == 'success') {
          captchaSubmitButton.classList.remove('captcha-error');
          captchaSubmitButton.classList.add('captcha-success');
          $el.placeholder = t("entryForm.captchaSuccess");
        }
  
        if (response == 'error') {
          captchaSubmitButton.classList.remove('captcha-success');
          captchaSubmitButton.classList.add('captcha-error');
          $el.placeholder = t("entryForm.captchaError");
        }
      }
    });
    captchaSubmitButton.addEventListener('click', (event) => {
      const jCaptchaCanvas = document.querySelector('.jCaptchaCanvas');
      const ctx = jCaptchaCanvas.getContext('2d');
      event.preventDefault();
      if (captcha.options.status == 'error') {
        ctx.clearRect(0, 0, 100, 45);
        this.setState({captchaStatus: false});
        captcha.validate();
      }
      if (captcha.options.status == 'success') {
        this.setState({captchaStatus: true});
        document.querySelector('#form-captcha-input').setAttribute("disabled", "disabled");
      }
    })
  }

  componentDidMount() {
    const phoneInput = document.querySelector('#input-telephone');
    phoneInput.addEventListener('keyup', () => phoneInput.value = phoneInput.value.replace(/[^\d|+]/g,''));
    phoneInput.addEventListener('keydown', () => phoneInput.value = phoneInput.value.replace(/[^\d|+]/g,''));
    this.initializationOfCaptcha(this.props.t);
  }

  handleCountOfCharactersChange = (event) => {
    const textarea = event.target.value;
    this.setState({countOfCharacters: textarea.length});
  }

  handleCategoryChange = (event) => {
    const category = event.target.value;
    this.setState({ isEventEntry: category=== IDS.EVENT});
  };

  handleFromChange = (from) => {
    this.setState({ startDate: from });
  };

  handleToChange = (to) => {
    this.setState({ endDate: to });
  };

  render() {
    const { isEdit, isEvent, formStartEndDate, license, dispatch, handleSubmit } = this.props;
    const { isEventEntry } = this.state;
    const { startDate } = this.state;
    const { endDate } = this.state;
    const initStartDate = formStartEndDate.startDate ? new window.Date(formStartEndDate.startDate) : '';
    const initEndDate = formStartEndDate.endDate ? new window.Date(formStartEndDate.endDate) : '';

    var t = (key) => {
      return this.props.t("entryForm." + key);
    };

    return (
    <FormWrapper>
      <ScrollableDiv>
        <AddEntryForm
          action    = 'javascript:void();' >

            <h3>{isEdit ? t("editEntryHeading") :  t("newEntryHeading")}</h3>

            { this.props.error &&
              <div className= "err">
                { t("savingError") + ":" + this.props.error.message}
              </div>
            }
            { (!this.props.error) && this.props.submitFailed &&
              <div className="err"> { t("valueError") }
                <FieldElement name="license" component={errorMessage} />
              </div>
            }

            <div className= "pure-form">
              <Fieldset>
                <FieldElement className="pure-input-1" name="category" disabled={ isEdit } component="select" onChange={this.handleCategoryChange}>
                  <option value={-1}>- {t("chooseCategory")} -</option>
                  <option value={IDS.INITIATIVE}>{t("category." + NAMES[IDS.INITIATIVE])}</option>

                  {/* this functionality will be made in future */}
                  {/* <option value={IDS.COMPANY}>{t("category." + NAMES[IDS.COMPANY])}</option> */}
                  <option value={IDS.EVENT}>{t("category." + NAMES[IDS.EVENT])}</option>
                </FieldElement>
                 
                <FieldElement name="category" component={errorMessage} />

                <FieldElement
                  name="title"
                  required={true}
                  className="pure-input-1"
                  type="text"
                  component="input"
                  placeholder={t("title")} />

                <FieldElement
                  name="title"
                  component={errorMessage} />

                {(isEventEntry || isEvent ) && (

                  <RangeDates>

                    <Date>
                      <FieldElement
                        name="start"
                        component={ renderDatePickerStart }
                        placeholder={t("startDate")}
                        initEndDate={ initEndDate }
                        endDate={ endDate }
                        onChange={ this.handleFromChange }
                      />

                      <FieldElement
                        name="start"
                        component={errorMessage}
                      />
                    </Date>

                    <Date>
                      <FieldElement
                        name="end"
                        component={ renderDatePickerEnd }
                        initStartDate={ initStartDate }
                        startDate={ startDate }
                        placeholder={t("endDate")}
                        onChange={ this.handleToChange }
                      />

                      <FieldElement
                        name="end"
                        component={errorMessage}
                      />
                    </Date>

                  </RangeDates>

                )}

                <FieldElement name="description" className="pure-input-1" id="description-form-textarea" onChange={this.handleCountOfCharactersChange} component="textarea" placeholder={t("description")} maxLength={this.state.maxCountOfCharacters}/>
                <CountOfCharacters>
                  <div className="countOfCharacters-block">{this.state.countOfCharacters}/{this.state.maxCountOfCharacters}</div>
                </CountOfCharacters>
                <FieldElement name="description" component={errorMessage} />

                <FieldElement
                  name="tags"
                  required={true}
                  className="pure-input-1"
                  component="input"
                  placeholder={t("tags")}
                  component={SelectTags}
                />
                <FieldElement
                  name="tags"
                  component={errorMessage}
                />
              </Fieldset>

              <Fieldset>
                <FieldsetLegend>
                  <FieldsetTitle>{t("location")}</FieldsetTitle>
                </FieldsetLegend>

                <div className= "pure-g">
                  <div className= "pure-u-15-24">
                    <FieldElement name="city" className="pure-input-1" component="input" placeholder={t("city")} />
                    <FieldElement name="city" component={errorMessage} />
                  </div>
                  <div className= "pure-u-9-24">
                    <FieldElement name="zip" className="pure-input-1" component="input" placeholder={t("zip")} />
                    <FieldElement name="zip" component={errorMessage} />
                  </div>
                </div>

                <FieldElement name="street" className="pure-input-1" component="input" placeholder={t("street")}/>
                <FieldElement name="street" component={errorMessage} />

                <ClickOnMapText>{t("clickOnMap")}</ClickOnMapText>

                <div className= "pure-g">
                  <label className= "pure-u-2-24">
                    <FontAwesomeIcon icon="map-marker" />
                  </label>
                  <div className= "pure-u-22-24 pure-g">
                    <div className= "pure-u-11-24">
                      <FieldElement name="lat" className="pure-input-1" component="input" readOnly={true}/>
                      <FieldElement name="lat" component={errorMessage} />
                    </div>
                    <div className= "pure-u-2-24"></div>
                    <div className= "pure-u-11-24">
                      <FieldElement name="lng" className="pure-input-1" component="input" readOnly={true} />
                      <FieldElement name="lng" component={errorMessage} />
                    </div>
                  </div>
                </div>
              </Fieldset>

              <Fieldset>
                <OptionalLegend>
                  <FieldsetTitle>{t("contact")}</FieldsetTitle>
                </OptionalLegend>
                <div className= "pure-g">
                  <OptionalFieldLabel className= "pure-u-2-24">
                    <FontAwesomeIcon icon="globe-africa" />
                  </OptionalFieldLabel>
                  <div className= "pure-u-22-24">
                    <FieldElement
                      name="homepage"
                      className="pure-input-1 optional"
                      component="input"
                      placeholder={t("homepage")} />
                    <FieldElement name="homepage" component={errorMessage} />
                  </div>
                </div>

                <div className= "pure-g">
                  <OptionalFieldLabel className= "pure-u-2-24">
                    <FontAwesomeIcon icon="envelope" />
                  </OptionalFieldLabel>
                  <div className= "pure-u-22-24">
                    <FieldElement name="email" type="email" className="pure-input-1 optional" component="input" placeholder={t("email")} />
                    <FieldElement name="email" component={errorMessage} />
                  </div>
                </div>

                <div className= "pure-g">
                  <OptionalFieldLabel className= "pure-u-2-24">
                    <FontAwesomeIcon icon="phone" />
                  </OptionalFieldLabel>
                  <div className= "pure-u-22-24">
                    <FieldElement name="telephone" id="input-telephone" className="pure-input-1 optional" component="input" placeholder={t("phone")} maxLength={16}/>
                    <FieldElement name="telephone" component={errorMessage} />
                  </div>
                </div>
              </Fieldset>

              <Fieldset>
                <OptionalLegend>
                  <FieldsetTitle>{t("entryImage")}</FieldsetTitle>
                </OptionalLegend>
                <OptionalFieldText>{t("imageUrlExplanation")}</OptionalFieldText>
                <div className= "pure-g">
                  <OptionalFieldLabel className= "pure-u-2-24">
                    <FontAwesomeIcon icon="camera" />
                  </OptionalFieldLabel>
                  <div className= "pure-u-22-24">
                    <FieldElement name="image_url" className="pure-input-1 optional" component="input" placeholder={t("imageUrl")} />
                    <FieldElement name="image_url" component={errorMessage} />
                  </div>
                </div>
                <div className= "pure-g">
                  <OptionalFieldLabel className= "pure-u-2-24">
                    <FontAwesomeIcon icon="link" />
                  </OptionalFieldLabel>
                  <div className= "pure-u-22-24">
                    <FieldElement name="image_link_url" className="pure-input-1 optional" component="input" placeholder={t("imageLink")} />
                    <FieldElement name="image_link_url" component={errorMessage} />
                  </div>
                </div>
              </Fieldset>

              <Fieldset>
                <FieldsetLegend>
                  <FieldsetTitle>{t("license")}</FieldsetTitle>
                </FieldsetLegend>
                <div className= "pure-g license">
                  <label className= "pure-u-2-24">
                    <FontAwesomeIcon icon={['fab', 'creative-commons']} />
                  </label>
                  <div className= "pure-u-2-24 pure-controls">
                    <FieldElement name="license" component="input" type="checkbox" />
                  </div>
                  <div className= "pure-u-20-24">
                    <FieldElement name="license" component={errorMessage} />
                    {t("iHaveRead") + " "}
                    { license == LICENSES.ODBL
                      ? <a target="_blank" href={URLs.ODBL_LICENSE.link}>
                        {t("openDatabaseLicense")}
                      </a>
                      : <a target="_blank" href={URLs.CC_LICENSE[this.props.lng].link}>
                        {t("creativeCommonsLicense")}
                      </a>
                    } {" " + t("licenseAccepted")}
                  </div>
                </div>
              </Fieldset>
              <Fieldset>
                <FieldsetLegend>
                  <FieldsetTitle>&laquo; {`${t("captchaTittle")}`} &raquo;</FieldsetTitle>
                </FieldsetLegend>
                <div className="captcha-container">
                  <div className="captcha-wrapper">
                    <FieldElement name="captcha" className="jCaptcha pure-input-1" id="form-captcha-input" type="text" component="input" placeholder={t("captchaInput")} />
                  </div>
                  <SubmitCaptchaButton id="captcha-submit-button">{t("captchaCheckButton")}</SubmitCaptchaButton>
                  <FieldElement name="captcha" component={errorMessage} />
                </div>
              </Fieldset>
            </div>
          </AddEntryForm>
        </ScrollableDiv>
        <StyledNavButtonWrapper className="menu pure-g">
          <NavButton
            keyName = "cancel"
            classname = "pure-u-1-2"
            onClick = {() => {
              this.props.dispatch(initialize(EDIT.id, {}, EDIT.fields));
              this.props.dispatch(isEdit ? Actions.cancelEdit() : Actions.cancelNew());
            }}
            icon = "ban"
            text = { t("cancel") }
          />
          <NavButton
            keyName = "save"
            classname = "pure-u-1-2"
            onClick = { () => {
              if (this.state.captchaStatus === false){
                document.querySelector('#captcha-submit-button').classList.add('captcha-error');
                alert(`${t("captchaPass")}. ${t("captchaError")}.`);
              } else {
                this.props.handleSubmit();
                const arrOfNames = ['category','title','description','lat','lng'];
                for (let i = 0; i < arrOfNames.length; i++) {
                  if(!document.getElementsByName(arrOfNames[i])[0].value||document.getElementsByName(arrOfNames[i])[0].value=='-1'){
                    document.getElementsByName(arrOfNames[i])[0].scrollIntoView({block: "center", behavior: "smooth"})
                    break;
                  }
                }
              }}}
            icon = "save"
            text = { t("save") }
          />
        </StyledNavButtonWrapper>
      </FormWrapper>)
  }
}

const mapStateToProps = state => {
  return {
    lng: state.lng.lng
  }
}


Form.propTypes = {
  isEdit : T.string,
  license: T.string,
  dispatch: T.func,
  tags: T.array
};

module.exports = reduxForm({
  form            : EDIT.id,
  validate        : validation.entryForm,
  asyncBlurFields : ['street', 'zip', 'city'],
  asyncValidate: function(values, dispatch) {
    dispatch(Actions.geocodeAndSetMarker(
          (values.street ? values.street + ' ' : '')
          .concat(
            (values.zip ? values.zip + ' ' : '')
              .concat((values.city ? values.city : '')))
      ));
      return new Promise((resolve, reject) => resolve());
  }
})(translate('translation')(Form));

const CountOfCharacters = styled.div`
  div.countOfCharacters-block {
    font-size: .5em;
    text-align: right;
    margin-top: 0rem;
    margin-bottom: .5rem;
  }
`

const SubmitCaptchaButton = styled.button`
  background: transparent;
  border-radius: 3px;
  border: 1px solid #ccc;
  margin: 0.25em 0;
  padding: 0.5em 0.6em;
  width: 100%;
`

const StyledNavButtonWrapper = styled(NavButtonWrapper)`
  height: 68px;
`

const AddEntryForm = styled.form`
  margin: 2em 1.6em 0;
  select {
    height: 2.5em;
  }
`
const FieldsetTitle = styled.span`
  margin-top: 0.5em;
  margin-bottom: 0;
`

const ClickOnMapText = styled.div`
  margin: 0.5em 0;
`

const FormWrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  select, input, textarea, .pure-input-1 {
    margin: 0.25rem 0;
  }

  textarea.pure-input-1 {
    min-height: 6rem;
    margin-bottom: 1rem;
  }
`

const FieldElement = styled(Field)`
  resize: none;
`;

const Fieldset = styled.fieldset`
  margin: 1em 0 1.5em !important;

  .err {
    color: red;
    margin-bottom: 10px;
  }
  
  .captcha-error {
    border-color: #f44;
    color: #f44;
  }

  .captcha-success {
    border-color: #08b008;
    color: #08b008;
  }
`;

const OptionalFieldLabel = styled.label`
  color: #777;
`;

const OptionalFieldText = styled.div`
  color: #777;
  margin-bottom: 4px;
`;
  
const FieldsetLegend = styled.legend`
  font-weight: 500 !important;
`;

const OptionalLegend = styled.legend`
  color: #777 !important;
  font-weight: 400 !important;
`;

const RangeDates = styled.div`
  display: flex;

  .DayPickerInput input {
    width: 100%;
  }
  
  input[readonly] {
    background-color: #fff;
    color: initial;
  }
  
  .DayPickerInput-OverlayWrapper {
    position: static;
  }

  .DayPickerInput-Overlay {
    left: 50%;
    transform: translateX(-50%);
  }
`;

const Date = styled.div`
  display: flex;
  flex-direction: column;

  :first-child {
    margin-right: 10px;
  }

`;

const errorMessage = ({ meta }) =>
  meta.error && meta.touched
    ? <div className="err">{meta.error}</div>
    : null
