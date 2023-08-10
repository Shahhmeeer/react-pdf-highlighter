import React, { Component } from "react";
import LCC from "lightning-container";

import {
  PdfLoader,
  PdfHighlighter,
  Tip,
  Highlight,
  Popup,
  AreaHighlight,
} from "./react-pdf-highlighter";

import type { IHighlight, NewHighlight } from "./react-pdf-highlighter";

import { testHighlights as _testHighlights } from "./test-highlights";
import { Spinner } from "./Spinner";
import { Sidebar } from "./Sidebar";

import "./style/App.css";

const testHighlights: Record<string, Array<IHighlight>> = _testHighlights;

interface State {
  url: string;
  highlights: Array<IHighlight>;
}

const getNextId = () => String(Math.random()).slice(2);

const parseIdFromHash = () =>
  document.location.hash.slice("#highlight-".length);

const resetHash = () => {
  document.location.hash = "";
};

const HighlightPopup = ({
  comment,
}: {
  comment: { text: string; emoji: string };
}) =>
  comment.text ? (
    <div className="Highlight__popup">
      {comment.emoji} {comment.text}
    </div>
  ) : null;

const queryParameters = new URLSearchParams(window.location.search);
const documentId = queryParameters.get("documentId");
console.log("The document id inside react is::: ", documentId);

const testing = window.location;
console.log("The testing has the value::: ", testing);

// const PRIMARY_PDF_URL = `/sfsites/c/sfc/servlet.shepherd/document/download/${documentId}?operationContext=S1`;
const PRIMARY_PDF_URL = `https://techmeoutio2-dev-ed.develop.my.site.com/RecruitersPortal/s/sfsites/c/sfc/servlet.shepherd/document/download/${documentId}`;
// const PRIMARY_PDF_URL = `https://techmeoutio2-dev-ed.develop.my.salesforce.com/sfc/p/7R000004Ns3Y/a/7R000004ewqO/oYwXxK1jXkcC4kNPLR26brT.6xEyN81kb.pMcu29wT4`;
console.log("The Pdf Link is::: ", PRIMARY_PDF_URL);

// const searchParams = new URLSearchParams(document.location.search);
// const initialUrl = searchParams.get("url") || PRIMARY_PDF_URL;
const initialUrl = PRIMARY_PDF_URL;

class App extends Component<{}, State> {
  state = {
    url: initialUrl,
    highlights: testHighlights[initialUrl]
      ? [...testHighlights[initialUrl]]
      : [],
  };

  resetHighlights = () => {
    this.setState({ highlights: [] });
  };

  // toggleDocument = () => {
  //   const newUrl =
  //     this.state.url === PRIMARY_PDF_URL ? SECONDARY_PDF_URL : PRIMARY_PDF_URL;

  //   this.setState({
  //     url: newUrl,
  //     highlights: testHighlights[newUrl] ? [...testHighlights[newUrl]] : [],
  //   });
  // };

  scrollViewerTo = (highlight: any) => {};

  scrollToHighlightFromHash = () => {
    const highlight = this.getHighlightById(parseIdFromHash());

    if (highlight) {
      this.scrollViewerTo(highlight);
    }
  };

  componentDidMount() {
    LCC.addMessageHandler((message: any) => {
      const receivedHighlights = message.highlights;
      const description = message.description;
      console.log(
        "Data received in React App. The object includes: ",
        receivedHighlights,
        description
      );
      let acceptedData: {
        content: { text: any };
        position: {
          boundingRect: {
            x1: any;
            y1: any;
            x2: any;
            y2: any;
            width: any;
            height: any;
          };
          rects: {
            x1: any;
            y1: any;
            x2: any;
            y2: any;
            width: any;
            height: any;
          }[];
          pageNumber: any;
        };
        comment: { text: any };
        id: any;
      }[] = [];
      receivedHighlights.map((receivedHighlight: any) => {
        console.log("Each single highlight is::: ", receivedHighlight);
        acceptedData.push({
          content: {
            text: receivedHighlight.Pdf_Content_Text__c,
          },
          position: {
            boundingRect: {
              x1: receivedHighlight.Pdf_Position_X1__c,
              y1: receivedHighlight.Pdf_Position_Y1__c,
              x2: receivedHighlight.Pdf_Position_X2__c,
              y2: receivedHighlight.Pdf_Position_Y2__c,
              width: receivedHighlight.Pdf_Position_Width__c,
              height: receivedHighlight.Pdf_Position_Height__c,
            },
            rects: [
              {
                x1: receivedHighlight.Pdf_Position_X1__c,
                y1: receivedHighlight.Pdf_Position_Y1__c,
                x2: receivedHighlight.Pdf_Position_X2__c,
                y2: receivedHighlight.Pdf_Position_Y2__c,
                width: receivedHighlight.Pdf_Position_Width__c,
                height: receivedHighlight.Pdf_Position_Height__c,
              },
            ],
            pageNumber: receivedHighlight.Pdf_Comment_Page_Number__c,
          },
          comment: {
            text: receivedHighlight.Pdf_Comment_Text__c,
          },
          id: receivedHighlight.Id,
        });
      });
      console.log(
        "Highlights that are about to be send to the Function is::: ",
        acceptedData
      );
      this.renderAfterHighlightsAreReceived(acceptedData);
    });
    window.addEventListener(
      "hashchange",
      this.scrollToHighlightFromHash,
      false
    );
  }

  renderAfterHighlightsAreReceived(pdfHighlights: any) {
    console.log("Highlights received in the function is::: ", pdfHighlights);
    this.setState({ highlights: pdfHighlights });
  }

  getHighlightById(id: string) {
    const { highlights } = this.state;
    return highlights.find((highlight) => highlight.id === id);
  }

  sendMessageToSalesforce(highlight: any) {
    LCC.sendMessage(highlight); // Sending the Data to Salesforce.
    console.log(
      "Data has been sent to salesforce for further useage",
      highlight
    );
  }

  addHighlight(highlight: NewHighlight) {
    const { highlights } = this.state;

    // console.log("Saving highlight", highlight);
    this.sendMessageToSalesforce(highlight);

    this.setState({
      highlights: [{ ...highlight, id: getNextId() }, ...highlights],
    });
  }

  updateHighlight(highlightId: string, position: Object, content: Object) {
    console.log("Updating highlight", highlightId, position, content);

    this.setState({
      highlights: this.state.highlights.map((h) => {
        const {
          id,
          position: originalPosition,
          content: originalContent,
          ...rest
        } = h;
        return id === highlightId
          ? {
              id,
              position: { ...originalPosition, ...position },
              content: { ...originalContent, ...content },
              ...rest,
            }
          : h;
      }),
    });
  }

  render() {
    const { url, highlights } = this.state;

    return (
      <div className="App" style={{ display: "flex", height: "100vh" }}>
        {console.log(
          "The highlights that are sent to the Sidebar is::: ",
          this.state.highlights
        )}
        <Sidebar
          highlights={highlights}
          resetHighlights={this.resetHighlights}
          // toggleDocument={this.toggleDocument}
        />
        <div
          style={{
            height: "100vh",
            width: "75vw",
            position: "relative",
          }}
        >
          <PdfLoader url={url} beforeLoad={<Spinner />}>
            {(pdfDocument) => (
              <PdfHighlighter
                pdfDocument={pdfDocument}
                enableAreaSelection={(event) => event.altKey}
                onScrollChange={resetHash}
                // pdfScaleValue="page-width"
                scrollRef={(scrollTo) => {
                  this.scrollViewerTo = scrollTo;

                  this.scrollToHighlightFromHash();
                }}
                onSelectionFinished={(
                  position,
                  content,
                  hideTipAndSelection,
                  transformSelection
                ) => (
                  <Tip
                    onOpen={transformSelection}
                    onConfirm={(comment) => {
                      this.addHighlight({ content, position, comment });

                      hideTipAndSelection();
                    }}
                  />
                )}
                highlightTransform={(
                  highlight,
                  index,
                  setTip,
                  hideTip,
                  viewportToScaled,
                  screenshot,
                  isScrolledTo
                ) => {
                  const isTextHighlight = !Boolean(
                    highlight.content && highlight.content.image
                  );

                  const component = isTextHighlight ? (
                    <Highlight
                      isScrolledTo={isScrolledTo}
                      position={highlight.position}
                      comment={highlight.comment}
                    />
                  ) : (
                    <AreaHighlight
                      isScrolledTo={isScrolledTo}
                      highlight={highlight}
                      onChange={(boundingRect) => {
                        this.updateHighlight(
                          highlight.id,
                          { boundingRect: viewportToScaled(boundingRect) },
                          { image: screenshot(boundingRect) }
                        );
                      }}
                    />
                  );

                  return (
                    <Popup
                      popupContent={<HighlightPopup {...highlight} />}
                      onMouseOver={(popupContent) =>
                        setTip(highlight, (highlight) => popupContent)
                      }
                      onMouseOut={hideTip}
                      key={index}
                      children={component}
                    />
                  );
                }}
                highlights={highlights}
              />
            )}
          </PdfLoader>
        </div>
      </div>
    );
  }
}

export default App;
